/**
 * Minimal PDF 1.4 writer: one or more pages of monospaced text. Enough for a real, openable report
 * download without a PDF library. Text is restricted to printable ASCII so byte offsets are exact.
 */

export interface PdfLine {
  text: string
  size?: number
  bold?: boolean
  /** RGB 0..1 */
  color?: [number, number, number]
}

const PAGE_W = 595 // A4 in points
const PAGE_H = 842
const MARGIN = 48

function ascii(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, '?')
}

function escapePdf(text: string): string {
  return ascii(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/** Wraps a line to `max` characters on word boundaries. */
export function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      if (line) out.push(line)
      line = w.length > max ? w.slice(0, max) : w
    } else line = (line + ' ' + w).trim()
  }
  if (line) out.push(line)
  return out.length ? out : ['']
}

export function buildPdf(lines: PdfLine[], title: string): Uint8Array<ArrayBuffer> {
  // Lay lines out into pages.
  const pages: string[] = []
  let ops: string[] = []
  let y = PAGE_H - MARGIN
  const flush = () => {
    pages.push(ops.join('\n'))
    ops = []
    y = PAGE_H - MARGIN
  }
  for (const line of lines) {
    const size = line.size ?? 10
    const lead = size * 1.45
    if (y - lead < MARGIN) flush()
    y -= lead
    const [r, g, b] = line.color ?? [0.08, 0.08, 0.1]
    ops.push(
      `BT /${line.bold ? 'F2' : 'F1'} ${size} Tf ${r} ${g} ${b} rg ${MARGIN} ${y.toFixed(1)} Td (${escapePdf(line.text)}) Tj ET`,
    )
  }
  flush()

  // Objects: 1 catalog, 2 pages, 3 font regular, 4 font bold, 5 info, then (page, content) pairs.
  const objects: string[] = []
  const pageIds = pages.map((_, i) => 6 + i * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>'
  objects[5] = `<< /Title (${escapePdf(title)}) /Producer (Clearsite) >>`
  pages.forEach((content, i) => {
    const pageId = 6 + i * 2
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`
    objects[pageId + 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })

  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = out.length
    out += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }
  const xref = out.length
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let id = 1; id < objects.length; id++) out += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new TextEncoder().encode(out)
}
