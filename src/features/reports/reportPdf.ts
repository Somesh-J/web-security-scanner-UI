import { buildPdf, wrap, type PdfLine } from '@/lib/pdf'
import { formatDuration, formatUtc } from '@/lib/format'
import { SEVERITY_RANK, SEVERITY_TAG, STATUS_LABEL } from '@/lib/labels'
import type { Finding, Report, Scan } from '@/types/domain'

const RED: [number, number, number] = [0.78, 0.06, 0.16]
const GREY: [number, number, number] = [0.35, 0.36, 0.4]

/** Builds the PDF for one report: cover block, summary, then every finding with location and fix. */
export function reportToPdf(
  report: Report,
  scan: Scan | undefined,
  findings: Finding[],
): Uint8Array<ArrayBuffer> {
  const sorted = [...findings].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
  const lines: PdfLine[] = [
    { text: 'REDCELL // WEB SECURITY ASSESSMENT', size: 9, color: RED, bold: true },
    { text: 'CONFIDENTIAL - authorised recipients only', size: 8, color: GREY },
    { text: '' },
    { text: `${report.target}`, size: 18, bold: true },
    { text: `Report ${report.id} for ${report.scanId}`, size: 10, color: GREY },
    { text: '' },
    { text: `Generated   ${formatUtc(report.createdAt)}`, size: 10 },
    { text: `Scan start  ${formatUtc(scan?.startedAt ?? null)}`, size: 10 },
    { text: `Duration    ${formatDuration(scan?.durationSec ?? null)}`, size: 10 },
    {
      text: `Findings    ${report.findings}  (CRIT ${scan?.findingsCount.critical ?? 0}  HIGH ${scan?.findingsCount.high ?? 0}  MED ${scan?.findingsCount.medium ?? 0}  LOW ${scan?.findingsCount.low ?? 0})`,
      size: 10,
    },
    { text: '' },
    { text: '-'.repeat(80), size: 8, color: GREY },
  ]

  if (sorted.length === 0) lines.push({ text: 'No findings were recorded for this scan.', size: 10 })

  sorted.forEach((f, i) => {
    lines.push({ text: '' })
    lines.push({
      text: `${String(i + 1).padStart(2, '0')}  [${SEVERITY_TAG[f.severity].padEnd(4)}]  ${f.title}`,
      size: 11,
      bold: true,
      color: f.severity === 'critical' ? RED : undefined,
    })
    lines.push({
      text: `    ${f.id} | ${f.category} | ${f.cwe} | ${STATUS_LABEL[f.status]}`,
      size: 8.5,
      color: GREY,
    })
    lines.push({ text: `    Location: ${f.location}`, size: 9 })
    for (const l of wrap(f.description, 88)) lines.push({ text: `    ${l}`, size: 9 })
    lines.push({ text: '    Fix:', size: 9, bold: true })
    for (const l of wrap(f.remediation, 88)) lines.push({ text: `    ${l}`, size: 9 })
  })

  lines.push(
    { text: '' },
    { text: '-'.repeat(80), size: 8, color: GREY },
    { text: 'End of report.', size: 8, color: GREY },
  )
  return buildPdf(lines, `${report.id} ${report.target}`)
}
