import type { FindingStatus, Severity } from '@/types/domain'

/**
 * FindingsQuery is the single source of truth for the findings view.
 * It lives in the URL (fromSearchParams / toSearchParams), so every view is shareable and Back works.
 */

export const SORT_KEYS = ['title', 'severity', 'category', 'cwe', 'target', 'status', 'date'] as const
export type SortKey = (typeof SORT_KEYS)[number]
export type SortDir = 'asc' | 'desc'
export interface SortSpec {
  key: SortKey
  dir: SortDir
}

export const PAGE_SIZES = [10, 20, 50] as const

export interface FindingsQuery {
  text: string
  severity: Severity[]
  status: FindingStatus[]
  /** OWASP codes, e.g. "A03". */
  category: string[]
  /** e.g. "CWE-89". */
  cwe: string[]
  /** Target IDs. */
  target: string[]
  /** Scan IDs. */
  scan: string[]
  sort: SortSpec[]
  page: number
  pageSize: number
}

export const DEFAULT_SORT: SortSpec[] = [{ key: 'severity', dir: 'desc' }]

export const EMPTY_QUERY: FindingsQuery = {
  text: '',
  severity: [],
  status: [],
  category: [],
  cwe: [],
  target: [],
  scan: [],
  sort: DEFAULT_SORT,
  page: 1,
  pageSize: 20,
}

/** Filters only (no sort or paging). Used to decide whether "Clear filters" makes sense. */
export function hasFilters(q: FindingsQuery): boolean {
  return Boolean(
    q.text ||
    q.severity.length ||
    q.status.length ||
    q.category.length ||
    q.cwe.length ||
    q.target.length ||
    q.scan.length,
  )
}

/* ---------- Value normalisers (shared by URL and prompt parsing) ---------- */

const SEVERITY_ALIASES: Record<string, Severity> = {
  crit: 'critical',
  critical: 'critical',
  c: 'critical',
  high: 'high',
  h: 'high',
  med: 'medium',
  medium: 'medium',
  m: 'medium',
  low: 'low',
  l: 'low',
  info: 'info',
  i: 'info',
  informational: 'info',
}

const STATUS_ALIASES: Record<string, FindingStatus> = {
  open: 'open',
  new: 'open',
  confirmed: 'confirmed',
  confirm: 'confirmed',
  resolved: 'resolved',
  fixed: 'resolved',
  fp: 'false_positive',
  false_positive: 'false_positive',
  'false-positive': 'false_positive',
  falsepositive: 'false_positive',
}

export function normaliseSeverity(value: string): Severity | null {
  return SEVERITY_ALIASES[value.toLowerCase()] ?? null
}

export function normaliseStatus(value: string): FindingStatus | null {
  return STATUS_ALIASES[value.toLowerCase()] ?? null
}

/** "A03", "a3", "3" -> "A03". Valid range A01 to A10. */
export function normaliseCategory(value: string): string | null {
  const m = /^a?0?(\d{1,2})$/i.exec(value.trim())
  if (!m?.[1]) return null
  const n = Number(m[1])
  if (n < 1 || n > 10) return null
  return `A${String(n).padStart(2, '0')}`
}

/** "89", "cwe-89", "CWE89" -> "CWE-89". */
export function normaliseCwe(value: string): string | null {
  const m = /^(?:cwe-?)?(\d{1,4})$/i.exec(value.trim())
  return m?.[1] ? `CWE-${Number(m[1])}` : null
}

export function parseSort(value: string): SortSpec[] | null {
  const specs: SortSpec[] = []
  for (const part of value.split(',').filter(Boolean)) {
    const desc = part.startsWith('-')
    const key = (desc ? part.slice(1) : part).toLowerCase()
    if (!(SORT_KEYS as readonly string[]).includes(key)) return null
    specs.push({ key: key as SortKey, dir: desc ? 'desc' : 'asc' })
  }
  return specs.length ? specs : null
}

export function serializeSort(sort: SortSpec[]): string {
  return sort.map((s) => (s.dir === 'desc' ? `-${s.key}` : s.key)).join(',')
}

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function mapValid<T>(raw: string | null, fn: (v: string) => T | null): T[] {
  if (!raw) return []
  return uniq(
    raw
      .split(',')
      .map((v) => fn(v.trim()))
      .filter((v): v is T => v !== null),
  )
}

/* ---------- URL <-> query ---------- */

/** Reads a query from URL search params. Invalid values are dropped, never thrown. */
export function fromSearchParams(params: URLSearchParams): FindingsQuery {
  const size = Number(params.get('size'))
  const page = Number(params.get('page'))
  return {
    text: params.get('q')?.trim() ?? '',
    severity: mapValid(params.get('sev'), normaliseSeverity),
    status: mapValid(params.get('status'), normaliseStatus),
    category: mapValid(params.get('cat'), normaliseCategory),
    cwe: mapValid(params.get('cwe'), normaliseCwe),
    target: mapValid(params.get('target'), (v) => v || null),
    scan: mapValid(params.get('scan'), (v) => v || null),
    sort: parseSort(params.get('sort') ?? '') ?? DEFAULT_SORT,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(size) ? size : EMPTY_QUERY.pageSize,
  }
}

/** Writes a query to URL search params, omitting defaults so URLs stay short and readable. */
export function toSearchParams(q: FindingsQuery): URLSearchParams {
  const p = new URLSearchParams()
  if (q.text) p.set('q', q.text)
  if (q.severity.length) p.set('sev', q.severity.join(','))
  if (q.status.length) p.set('status', q.status.join(','))
  if (q.category.length) p.set('cat', q.category.join(','))
  if (q.cwe.length) p.set('cwe', q.cwe.join(','))
  if (q.target.length) p.set('target', q.target.join(','))
  if (q.scan.length) p.set('scan', q.scan.join(','))
  const sort = serializeSort(q.sort)
  if (sort !== serializeSort(DEFAULT_SORT)) p.set('sort', sort)
  if (q.page > 1) p.set('page', String(q.page))
  if (q.pageSize !== EMPTY_QUERY.pageSize) p.set('size', String(q.pageSize))
  return p
}
