/**
 * Highlighting and redaction rules for raw HTTP evidence.
 * Pure functions: they turn a raw string into typed segments that the EvidencePanel renders.
 */

export type SegmentKind = 'text' | 'payload' | 'leak' | 'secret' | 'header'

export interface Segment {
  kind: SegmentKind
  text: string
}

/** Attacker-controlled input worth pointing at in a request. */
const PAYLOAD_PATTERNS: RegExp[] = [
  /%27|%3Cscript%3E.*?%3C\/script%3E|%3Csvg[^ ]*%3E|%7B%7B7\*7%7D%7D/gi,
  /<img src=x onerror=[^>]*>|<svg\/onload=[^>]*>/gi,
  /\$\{jndi:[^}]+\}/g,
  /"\$ne":null/g,
  /127\.0\.0\.1;id/g,
  /(?:\.\.\/){2,}[^\s]*/g,
  /http:\/\/169\.254\.169\.254[^"\s]*/g,
  /http:\/\/10\.\d+\.\d+\.\d+[^"\s]*/g,
  /<!ENTITY x SYSTEM "file:\/\/\/etc\/passwd">/g,
  /eyJhbGciOiJub25lIn0[^"]*/g,
  /"role":"admin"/g,
  /username=admin&password=admin/g,
  /next=https:\/\/evil\.example[^\s]*/g,
  /Origin: https:\/\/evil\.example/g,
  /PSESSIONID=fixated-1234/g,
  /%0a2026[^&]*/g,
]

/** Evidence of impact in a response. */
const LEAK_PATTERNS: RegExp[] = [
  /You have an error in your SQL syntax;?/g,
  /uid=\d+\([^)]+\)[^"\n]*/g,
  /root:x:0:0:[^"\n\\]*/g,
  /AccessKeyId[^,]*/g,
  /DATABASE_URL=[^\n]*|STRIPE_SECRET=[^\n]*/g,
  /"hmacSecret":"[^"]+"/g,
  /"iban":"[^"]+"/g,
  /<script>alert\(document\.domain\)<\/script>|<svg\/onload=alert\(1\)>/g,
  /Results for 49/g,
  /"role":"(?:admin|owner)"/g,
  /Access-Control-Allow-Origin: https:\/\/evil\.example/g,
  /Location: https:\/\/evil\.example[^\n]*/g,
  /Stable tag: 5\.3\.1|jQuery v1\.12\.4/g,
  /Incorrect password for [^"]+/g,
  /Server: nginx\/[\d.]+[^\n]*|X-Powered-By: [^\n]*/g,
  /sha1WithRSAEncryption|version: TLS 1\.0/g,
  /# [^\n]*(?:callback|resolved from|no 429|expected|forged|no new Set-Cookie|no [A-Z][\w-]+ header present|no X-Frame|no integrity)[^\n]*/g,
]

/** Values that are secrets and are hidden until the operator chooses to reveal them. */
const SECRET_PATTERNS: RegExp[] = [
  /(?<=Cookie: )[^\n]+/g,
  /(?<=Authorization: Bearer )[^\s]+/g,
  /(?<=Set-Cookie: )[^;\n]+/g,
]

interface Match {
  start: number
  end: number
  kind: SegmentKind
}

function collect(source: string, patterns: RegExp[], kind: SegmentKind): Match[] {
  const out: Match[] = []
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)
    let m: RegExpExecArray | null
    while ((m = re.exec(source)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++
        continue
      }
      out.push({ start: m.index, end: m.index + m[0].length, kind })
    }
  }
  return out
}

/**
 * Splits one line of evidence into segments. Earlier match kinds win on overlap: secret > payload > leak.
 * Header names ("Host:") are marked so they can be dimmed.
 */
export function segmentLine(line: string, side: 'request' | 'response'): Segment[] {
  const matches = [
    ...collect(line, SECRET_PATTERNS, 'secret'),
    ...collect(line, side === 'request' ? PAYLOAD_PATTERNS : [], 'payload'),
    ...collect(line, side === 'response' ? LEAK_PATTERNS : [], 'leak'),
  ]
  const header = /^([A-Za-z-]+): /.exec(line)
  if (header?.[1]) matches.push({ start: 0, end: header[1].length + 1, kind: 'header' })

  // Resolve overlaps: keep the first-registered match for any character.
  const owner: (SegmentKind | null)[] = new Array<SegmentKind | null>(line.length).fill(null)
  for (const m of matches) {
    let free = true
    for (let i = m.start; i < m.end; i++) if (owner[i]) free = false
    if (!free) continue
    for (let i = m.start; i < m.end; i++) owner[i] = m.kind
  }

  const segments: Segment[] = []
  let current: Segment | null = null
  for (let i = 0; i < line.length; i++) {
    const kind = owner[i] ?? 'text'
    const ch = line.charAt(i)
    if (current && current.kind === kind) current.text += ch
    else {
      current = { kind, text: ch }
      segments.push(current)
    }
  }
  return segments
}

export function redact(text: string): string {
  return '█'.repeat(Math.min(16, Math.max(6, Math.ceil(text.length / 3))))
}
