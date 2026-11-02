import { describe, expect, it } from 'vitest'
import {
  EMPTY_QUERY,
  fromSearchParams,
  hasFilters,
  normaliseCategory,
  normaliseCwe,
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

describe('hasFilters', () => {
  it('ignores sort and paging, but sees any filter or search text', () => {
    expect(hasFilters(EMPTY_QUERY)).toBe(false)
    expect(hasFilters({ ...EMPTY_QUERY, page: 3, pageSize: 50 })).toBe(false)
    expect(hasFilters({ ...EMPTY_QUERY, text: 'sql' })).toBe(true)
    expect(hasFilters({ ...EMPTY_QUERY, status: ['open'] })).toBe(true)
  })
})
