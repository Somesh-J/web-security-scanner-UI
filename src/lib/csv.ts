import type { Finding } from '@/types/domain'

/**
 * RFC 4180 CSV. Cells that start with = + - @ are prefixed with a quote so spreadsheet apps do not
 * execute them as formulas (CSV injection, CWE-1236). A security tool should not ship that bug itself.
 */
export function csvCell(value: string | number): string {
  let s = String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}

export function findingsToCsv(findings: Finding[], targetNames: ReadonlyMap<string, string>): string {
  const header = [
    'id',
    'title',
    'severity',
    'category',
    'cwe',
    'target',
    'status',
    'location',
    'scan',
    'discovered_at',
  ]
  const rows = findings.map((f) => [
    f.id,
    f.title,
    f.severity,
    f.category,
    f.cwe,
    targetNames.get(f.targetId) ?? f.targetId,
    f.status,
    f.location,
    f.scanId,
    f.discoveredAt,
  ])
  return toCsv([header, ...rows])
}
