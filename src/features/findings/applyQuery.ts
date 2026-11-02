import { categoryCode, SEVERITY_RANK, STATUS_RANK } from '@/lib/labels'
import type { Finding, FindingStatus, Severity } from '@/types/domain'
import type { FindingsQuery, SortKey, SortSpec } from './query'

/**
 * The findings pipeline: filter -> sort -> paginate, as one pure function.
 * Pure means it is trivially unit-tested and safe to memoise on (findings, query).
 */

export interface QueryContext {
  /** Target ID -> display name, used for text search and the "target" sort. */
  targetNames: ReadonlyMap<string, string>
}

export interface QueryResult {
  /** The current page of rows. */
  rows: Finding[]
  /** Every row that matches the filters, sorted. Used for CSV export and "select all matching". */
  matched: Finding[]
  total: number
  page: number
  pageCount: number
}

type FilterFacet = 'severity' | 'status' | 'category' | 'cwe' | 'target' | 'scan' | 'text'

function matchesText(f: Finding, words: string[], ctx: QueryContext): boolean {
  if (!words.length) return true
  const haystack = [
    f.id,
    f.title,
    f.cwe,
    f.category,
    f.location,
    ctx.targetNames.get(f.targetId) ?? '',
    f.scanId,
  ]
    .join(' ')
    .toLowerCase()
  return words.every((w) => haystack.includes(w))
}

/** Applies every filter except `skip`. Skipping one facet is how chip counts are computed. */
function filterFindings(
  findings: Finding[],
  q: FindingsQuery,
  ctx: QueryContext,
  skip?: FilterFacet,
): Finding[] {
  const words = q.text.toLowerCase().split(/\s+/).filter(Boolean)
  const sev = new Set(q.severity)
  const status = new Set(q.status)
  const cat = new Set(q.category)
  const cwe = new Set(q.cwe)
  const target = new Set(q.target)
  const scan = new Set(q.scan)
  return findings.filter(
    (f) =>
      (skip === 'severity' || !sev.size || sev.has(f.severity)) &&
      (skip === 'status' || !status.size || status.has(f.status)) &&
      (skip === 'category' || !cat.size || cat.has(categoryCode(f.category))) &&
      (skip === 'cwe' || !cwe.size || cwe.has(f.cwe)) &&
      (skip === 'target' || !target.size || target.has(f.targetId)) &&
      (skip === 'scan' || !scan.size || scan.has(f.scanId)) &&
      (skip === 'text' || matchesText(f, words, ctx)),
  )
}

function compareBy(key: SortKey, a: Finding, b: Finding, ctx: QueryContext): number {
  switch (key) {
    case 'severity':
      return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    case 'status':
      return STATUS_RANK[a.status] - STATUS_RANK[b.status]
    case 'date':
      return Date.parse(a.discoveredAt) - Date.parse(b.discoveredAt)
    case 'cwe':
      return Number(a.cwe.replace(/\D/g, '')) - Number(b.cwe.replace(/\D/g, ''))
    case 'category':
      return a.category.localeCompare(b.category)
    case 'target':
      return (ctx.targetNames.get(a.targetId) ?? a.targetId).localeCompare(
        ctx.targetNames.get(b.targetId) ?? b.targetId,
      )
    case 'title':
      return a.title.localeCompare(b.title)
  }
}

/** Multi-key sort with stable tie-breakers (newest first, then ID) so pages never reshuffle. */
export function sortFindings(findings: Finding[], sort: SortSpec[], ctx: QueryContext): Finding[] {
  const specs: SortSpec[] = [...sort, { key: 'date', dir: 'desc' }]
  return [...findings].sort((a, b) => {
    for (const s of specs) {
      const c = compareBy(s.key, a, b, ctx)
      if (c !== 0) return s.dir === 'asc' ? c : -c
    }
    return a.id.localeCompare(b.id)
  })
}

export function applyQuery(findings: Finding[], q: FindingsQuery, ctx: QueryContext): QueryResult {
  const matched = sortFindings(filterFindings(findings, q, ctx), q.sort, ctx)
  const total = matched.length
  const pageCount = Math.max(1, Math.ceil(total / q.pageSize))
  // Clamp rather than show an empty page when filters shrink the result set.
  const page = Math.min(Math.max(1, q.page), pageCount)
  const start = (page - 1) * q.pageSize
  return { rows: matched.slice(start, start + q.pageSize), matched, total, page, pageCount }
}

export interface FacetCounts {
  severity: Record<Severity, number>
  status: Record<FindingStatus, number>
  category: Record<string, number>
}

/**
 * Count per chip value, given every *other* active filter. This tells the analyst exactly how many rows
 * a chip will add before they click it (the "faceted search" pattern).
 */
export function facetCounts(findings: Finding[], q: FindingsQuery, ctx: QueryContext): FacetCounts {
  const severity: FacetCounts['severity'] = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  const status: FacetCounts['status'] = { open: 0, confirmed: 0, resolved: 0, false_positive: 0 }
  const category: Record<string, number> = {}
  for (const f of filterFindings(findings, q, ctx, 'severity')) severity[f.severity]++
  for (const f of filterFindings(findings, q, ctx, 'status')) status[f.status]++
  for (const f of filterFindings(findings, q, ctx, 'category')) {
    const code = categoryCode(f.category)
    category[code] = (category[code] ?? 0) + 1
  }
  return { severity, status, category }
}
