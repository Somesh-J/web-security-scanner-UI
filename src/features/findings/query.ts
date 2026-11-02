import { FINDING_STATUSES, SEVERITIES, type FindingStatus, type Severity } from '@/types/domain'

/**
 * FindingsQuery is the single source of truth for the findings view.
 * Three representations stay in sync through the pure functions in this file:
 *   URL search params  <->  FindingsQuery  <->  prompt text ("sev:crit status:open sql")
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
    q.text || q.severity.length || q.status.length || q.category.length || q.cwe.length || q.target.length || q.scan.length,
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

/* ---------- Prompt text <-> query ---------- */

export const PROMPT_KEYS = ['sev', 'status', 'cat', 'cwe', 'target', 'scan', 'sort', 'page', 'size'] as const
export type PromptKey = (typeof PROMPT_KEYS)[number]

export interface PromptIssue {
  token: string
  message: string
}

export interface PromptParseResult {
  query: FindingsQuery
  issues: PromptIssue[]
}

export interface PromptContext {
  /** Lets "target:acme" or target:"Acme Store" resolve to a target ID. */
  targets?: { id: string; name: string }[]
}

/** Splits on spaces but keeps "quoted phrases" and key:"quoted values" together. */
export function tokenize(input: string): string[] {
  const tokens: string[] = []
  const re = /(\S+?:"[^"]*"?|"[^"]*"?|\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) tokens.push(m[0])
  return tokens
}

function unquote(value: string): string {
  return value.replace(/^"/, '').replace(/"$/, '')
}

function resolveTarget(value: string, ctx: PromptContext): string | null {
  const v = value.toLowerCase()
  const targets = ctx.targets ?? []
  const byId = targets.find((t) => t.id.toLowerCase() === v)
  if (byId) return byId.id
  const exact = targets.find((t) => t.name.toLowerCase() === v)
  if (exact) return exact.id
  const partial = targets.filter((t) => t.name.toLowerCase().includes(v))
  if (partial.length === 1 && partial[0]) return partial[0].id
  // Without a target list (e.g. unit tests) keep the raw value as an ID.
  return targets.length ? null : value
}

/**
 * Parses prompt text into a full query. Unknown keys and invalid values become `issues` (shown inline,
 * never blocking); everything that is valid is still applied.
 */
export function parsePrompt(input: string, ctx: PromptContext = {}): PromptParseResult {
  const q: FindingsQuery = { ...EMPTY_QUERY, sort: DEFAULT_SORT }
  const issues: PromptIssue[] = []
  const words: string[] = []
  const lists = { severity: [] as Severity[], status: [] as FindingStatus[], category: [] as string[], cwe: [] as string[], target: [] as string[], scan: [] as string[] }

  for (const token of tokenize(input)) {
    const sep = token.indexOf(':')
    const isPair = sep > 0 && !token.startsWith('"')
    if (!isPair) {
      words.push(unquote(token))
      continue
    }
    const key = token.slice(0, sep).toLowerCase()
    const rawValue = unquote(token.slice(sep + 1))
    if (!(PROMPT_KEYS as readonly string[]).includes(key)) {
      issues.push({ token, message: `Unknown filter "${key}". Try ${PROMPT_KEYS.join(', ')}.` })
      continue
    }
    if (!rawValue) {
      issues.push({ token, message: `Add a value after ${key}:` })
      continue
    }
    const values = key === 'target' ? [rawValue] : rawValue.split(',').filter(Boolean)
    const collect = <T>(target: T[], fn: (v: string) => T | null, label: string) => {
      for (const v of values) {
        const n = fn(v)
        if (n === null) issues.push({ token, message: `"${v}" is not a valid ${label}.` })
        else if (!target.includes(n)) target.push(n)
      }
    }
    switch (key as PromptKey) {
      case 'sev':
        collect(lists.severity, normaliseSeverity, 'severity (crit, high, med, low, info)')
        break
      case 'status':
        collect(lists.status, normaliseStatus, 'status (open, confirmed, resolved, fp)')
        break
      case 'cat':
        collect(lists.category, normaliseCategory, 'OWASP category (A01 to A10)')
        break
      case 'cwe':
        collect(lists.cwe, normaliseCwe, 'CWE number')
        break
      case 'target':
        collect(lists.target, (v) => resolveTarget(v, ctx), 'target')
        break
      case 'scan':
        collect(lists.scan, (v) => (/^scan_\d+$/i.test(v) ? v.toLowerCase() : null), 'scan ID (scan_118)')
        break
      case 'sort': {
        const sort = parseSort(rawValue)
        if (sort) q.sort = sort
        else issues.push({ token, message: `Sort by ${SORT_KEYS.join(', ')}. Prefix with - for descending.` })
        break
      }
      case 'page': {
        const n = Number(rawValue)
        if (Number.isInteger(n) && n > 0) q.page = n
        else issues.push({ token, message: 'Page must be a positive whole number.' })
        break
      }
      case 'size': {
        const n = Number(rawValue)
        if ((PAGE_SIZES as readonly number[]).includes(n)) q.pageSize = n
        else issues.push({ token, message: `Page size must be ${PAGE_SIZES.join(', ')}.` })
        break
      }
    }
  }

  return { query: { ...q, ...lists, text: words.join(' ').trim() }, issues }
}

const SEVERITY_SHORT: Record<Severity, string> = { critical: 'crit', high: 'high', medium: 'med', low: 'low', info: 'info' }
const STATUS_SHORT: Record<FindingStatus, string> = { open: 'open', confirmed: 'confirmed', resolved: 'resolved', false_positive: 'fp' }

function quoteIfNeeded(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value
}

/** Writes a query as prompt text. parsePrompt(serializePrompt(q)) round-trips to the same query. */
export function serializePrompt(q: FindingsQuery): string {
  const parts: string[] = []
  if (q.severity.length) parts.push(`sev:${sortBy(q.severity, SEVERITIES).map((s) => SEVERITY_SHORT[s]).join(',')}`)
  if (q.status.length) parts.push(`status:${sortBy(q.status, FINDING_STATUSES).map((s) => STATUS_SHORT[s]).join(',')}`)
  if (q.category.length) parts.push(`cat:${q.category.join(',')}`)
  if (q.cwe.length) parts.push(`cwe:${q.cwe.map((c) => c.replace('CWE-', '')).join(',')}`)
  for (const t of q.target) parts.push(`target:${quoteIfNeeded(t)}`)
  if (q.scan.length) parts.push(`scan:${q.scan.join(',')}`)
  const sort = serializeSort(q.sort)
  if (sort !== serializeSort(DEFAULT_SORT)) parts.push(`sort:${sort}`)
  if (q.pageSize !== EMPTY_QUERY.pageSize) parts.push(`size:${q.pageSize}`)
  if (q.page > 1) parts.push(`page:${q.page}`)
  if (q.text) parts.push(q.text)
  return parts.join(' ')
}

function sortBy<T>(values: T[], order: readonly T[]): T[] {
  return [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}
