import { describe, expect, it } from 'vitest'
import {
  EMPTY_QUERY,
  fromSearchParams,
  hasFilters,
  normaliseCategory,
  normaliseCwe,
  parsePrompt,
  serializePrompt,
  tokenize,
  toSearchParams,
  type FindingsQuery,
} from './query'

const q = (over: Partial<FindingsQuery>): FindingsQuery => ({ ...EMPTY_QUERY, ...over })

describe('normalisers', () => {
  it('accepts loose OWASP category input', () => {
    expect(normaliseCategory('A03')).toBe('A03')
    expect(normaliseCategory('a3')).toBe('A03')
    expect(normaliseCategory('10')).toBe('A10')
    expect(normaliseCategory('A11')).toBeNull()
    expect(normaliseCategory('x')).toBeNull()
  })

  it('accepts loose CWE input', () => {
    expect(normaliseCwe('89')).toBe('CWE-89')
    expect(normaliseCwe('cwe-079')).toBe('CWE-79')
    expect(normaliseCwe('CWE89')).toBe('CWE-89')
    expect(normaliseCwe('sql')).toBeNull()
  })
})

describe('URL search params', () => {
  it('omits defaults so an empty query is an empty URL', () => {
    expect(toSearchParams(EMPTY_QUERY).toString()).toBe('')
  })

  it('round-trips a fully specified query', () => {
    const query = q({
      text: 'sql injection',
      severity: ['critical', 'high'],
      status: ['open'],
      category: ['A03'],
      cwe: ['CWE-89'],
      target: ['tgt_01'],
      scan: ['scan_118'],
      sort: [{ key: 'date', dir: 'asc' }],
      page: 3,
      pageSize: 50,
    })
    expect(fromSearchParams(toSearchParams(query))).toEqual(query)
  })

  it('drops invalid values instead of failing', () => {
    const parsed = fromSearchParams(new URLSearchParams('sev=crit,bogus&page=-2&size=7&sort=nope&cat=A99'))
    expect(parsed.severity).toEqual(['critical'])
    expect(parsed.page).toBe(1)
    expect(parsed.pageSize).toBe(20)
    expect(parsed.sort).toEqual(EMPTY_QUERY.sort)
    expect(parsed.category).toEqual([])
  })
})

describe('prompt parsing', () => {
  it('keeps quoted phrases together', () => {
    expect(tokenize('target:"Acme Store" "sql injection" sev:crit')).toEqual([
      'target:"Acme Store"',
      '"sql injection"',
      'sev:crit',
    ])
  })

  it('parses keys, aliases and free text together', () => {
    const { query, issues } = parsePrompt('sev:crit,med status:fp cat:3 cwe:89 sort:-date,title search page:2')
    expect(issues).toEqual([])
    expect(query.severity).toEqual(['critical', 'medium'])
    expect(query.status).toEqual(['false_positive'])
    expect(query.category).toEqual(['A03'])
    expect(query.cwe).toEqual(['CWE-89'])
    expect(query.sort).toEqual([
      { key: 'date', dir: 'desc' },
      { key: 'title', dir: 'asc' },
    ])
    expect(query.text).toBe('search')
    expect(query.page).toBe(2)
  })

  it('reports invalid tokens but still applies valid ones', () => {
    const { query, issues } = parsePrompt('sev:crit,urgent colour:red sql')
    expect(query.severity).toEqual(['critical'])
    expect(query.text).toBe('sql')
    expect(issues.map((i) => i.token)).toEqual(['sev:crit,urgent', 'colour:red'])
  })

  it('resolves target names to IDs when a target list is given', () => {
    const targets = [
      { id: 'tgt_01', name: 'Acme Store' },
      { id: 'tgt_02', name: 'Billing API' },
    ]
    expect(parsePrompt('target:"acme store"', { targets }).query.target).toEqual(['tgt_01'])
    expect(parsePrompt('target:billing', { targets }).query.target).toEqual(['tgt_02'])
    expect(parsePrompt('target:nowhere', { targets }).issues).toHaveLength(1)
  })

  it('round-trips prompt text through serializePrompt', () => {
    const query = q({
      text: 'jwt',
      severity: ['high', 'critical'],
      status: ['open', 'false_positive'],
      category: ['A07'],
      cwe: ['CWE-347'],
      scan: ['scan_111'],
      sort: [{ key: 'status', dir: 'asc' }],
      pageSize: 50,
    })
    const text = serializePrompt(query)
    expect(text).toBe('sev:crit,high status:open,fp cat:A07 cwe:347 scan:scan_111 sort:status size:50 jwt')
    const reparsed = parsePrompt(text).query
    expect(reparsed).toEqual({ ...query, severity: ['critical', 'high'] })
  })

  it('knows when filters are active', () => {
    expect(hasFilters(EMPTY_QUERY)).toBe(false)
    expect(hasFilters(q({ text: 'x' }))).toBe(true)
    expect(hasFilters(q({ page: 4 }))).toBe(false)
  })
})
