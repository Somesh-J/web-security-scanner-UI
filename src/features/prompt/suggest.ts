import { OWASP_CATEGORIES } from '@/types/domain'
import { categoryName } from '@/lib/labels'
import { PAGE_SIZES, PROMPT_KEYS, SORT_KEYS } from '@/features/findings/query'

export interface Suggestion {
  /** Text inserted in place of the partial token. */
  insert: string
  /** What the list shows. */
  label: string
  hint?: string
  /** Keys end with ":" and keep the menu open; values add a trailing space. */
  kind: 'key' | 'value' | 'command'
}

export interface SuggestContext {
  targets: { id: string; name: string }[]
  cwes: string[]
  scans: string[]
}

const KEY_HINTS: Record<string, string> = {
  sev: 'severity: crit high med low info',
  status: 'open confirmed resolved fp',
  cat: 'OWASP category A01 to A10',
  cwe: 'CWE number, e.g. 89',
  target: 'target name or ID',
  scan: 'scan ID, e.g. scan_118',
  sort: 'severity, date, title ... prefix - for desc',
  page: 'page number',
  size: 'rows per page: 10, 20, 50',
}

const COMMANDS: { word: string; hint: string }[] = [
  { word: 'goto', hint: 'go to a screen' },
  { word: 'open', hint: 'open a finding by ID' },
  { word: 'scan', hint: 'launch a scan on a target' },
  { word: 'export', hint: 'download current view as CSV' },
  { word: 'theme', hint: 'dark, light or system' },
  { word: 'clear', hint: 'clear all filters' },
  { word: 'help', hint: 'list everything' },
]

function valuesFor(key: string, ctx: SuggestContext): { value: string; hint?: string }[] {
  switch (key) {
    case 'sev':
      return ['crit', 'high', 'med', 'low', 'info'].map((value) => ({ value }))
    case 'status':
      return [
        { value: 'open' },
        { value: 'confirmed' },
        { value: 'resolved' },
        { value: 'fp', hint: 'false positive' },
      ]
    case 'cat':
      return OWASP_CATEGORIES.map((c) => ({ value: c.slice(0, 3), hint: categoryName(c) }))
    case 'cwe':
      return ctx.cwes.map((c) => ({ value: c.replace('CWE-', ''), hint: c }))
    case 'target':
      return ctx.targets.map((t) => ({ value: /\s/.test(t.name) ? `"${t.name}"` : t.name, hint: t.id }))
    case 'scan':
      return ctx.scans.map((value) => ({ value }))
    case 'sort':
      return SORT_KEYS.flatMap((k) => [
        { value: `-${k}`, hint: `${k}, descending` },
        { value: k, hint: `${k}, ascending` },
      ])
    case 'size':
      return PAGE_SIZES.map((n) => ({ value: String(n) }))
    default:
      return []
  }
}

/** Suggestions for the token under the cursor (the last whitespace-separated token). */
export function suggest(
  input: string,
  ctx: SuggestContext,
  isFirstToken: boolean,
): { partial: string; items: Suggestion[] } {
  const match = /(\S*)$/.exec(input)
  const token = match?.[1] ?? ''
  if (!token) return { partial: '', items: [] }

  const sep = token.indexOf(':')
  if (sep > 0) {
    const key = token.slice(0, sep).toLowerCase()
    const valuePart = token.slice(sep + 1)
    const lastComma = valuePart.lastIndexOf(',')
    const prefix = token.slice(0, sep + 1) + valuePart.slice(0, lastComma + 1)
    const partial = valuePart
      .slice(lastComma + 1)
      .replace(/^"/, '')
      .toLowerCase()
    const items = valuesFor(key, ctx)
      .filter(
        (v) => v.value.replace(/^"/, '').toLowerCase().startsWith(partial) && `${prefix}${v.value}` !== token,
      )
      .slice(0, 8)
      .map<Suggestion>((v) => ({
        insert: `${prefix}${v.value}`,
        label: v.value,
        hint: v.hint,
        kind: 'value',
      }))
    return { partial: token, items }
  }

  const lower = token.toLowerCase()
  const keys = PROMPT_KEYS.filter((k) => k.startsWith(lower)).map<Suggestion>((k) => ({
    insert: `${k}:`,
    label: `${k}:`,
    hint: KEY_HINTS[k],
    kind: 'key',
  }))
  const commands = isFirstToken
    ? COMMANDS.filter((c) => c.word.startsWith(lower) && c.word !== lower).map<Suggestion>((c) => ({
        insert: c.word,
        label: c.word,
        hint: c.hint,
        kind: 'command',
      }))
    : []
  return { partial: token, items: [...keys, ...commands].slice(0, 8) }
}
