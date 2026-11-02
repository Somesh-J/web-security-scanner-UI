import { describe, expect, it } from 'vitest'
import { createSeed } from '@/mocks/data/seed'
import { categoryCode } from '@/lib/labels'
import type { Finding } from '@/types/domain'
import { applyQuery, facetCounts, sortFindings } from './applyQuery'
import { EMPTY_QUERY, type FindingsQuery } from './query'

const seed = createSeed(Date.parse('2026-11-02T12:00:00Z'))
const findings: Finding[] = seed.findings
const ctx = { targetNames: new Map(seed.targets.map((t) => [t.id, t.name])) }
const q = (over: Partial<FindingsQuery>): FindingsQuery => ({ ...EMPTY_QUERY, ...over })

describe('seed data meets the brief', () => {
  it('has at least 40 findings across every severity and all ten OWASP categories', () => {
    expect(findings.length).toBeGreaterThanOrEqual(40)
    expect(new Set(findings.map((f) => f.severity))).toEqual(new Set(['critical', 'high', 'medium', 'low', 'info']))
    expect(new Set(findings.map((f) => categoryCode(f.category))).size).toBe(10)
    expect(findings.every((f) => /^CWE-\d+$/.test(f.cwe))).toBe(true)
    expect(new Set(findings.map((f) => f.id)).size).toBe(findings.length)
  })

  it('reproduces the contract example finding', () => {
    const example = findings.find((f) => f.id === 'fnd_5231')
    expect(example).toMatchObject({ scanId: 'scan_118', targetId: 'tgt_01', severity: 'critical', cwe: 'CWE-89' })
  })
})

describe('applyQuery', () => {
  it('returns everything, paginated, for an empty query', () => {
    const r = applyQuery(findings, EMPTY_QUERY, ctx)
    expect(r.total).toBe(findings.length)
    expect(r.rows).toHaveLength(20)
    expect(r.pageCount).toBe(Math.ceil(findings.length / 20))
  })

  it('combines text search, multi-filters, sort and pagination', () => {
    const r = applyQuery(
      findings,
      q({ text: 'xss', severity: ['high', 'medium'], status: ['open', 'confirmed'], sort: [{ key: 'title', dir: 'asc' }], pageSize: 10 }),
      ctx,
    )
    expect(r.total).toBeGreaterThan(0)
    for (const f of r.matched) {
      expect(f.title.toLowerCase()).toContain('xss')
      expect(['high', 'medium']).toContain(f.severity)
      expect(['open', 'confirmed']).toContain(f.status)
    }
    const titles = r.matched.map((f) => f.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)))
  })

  it('requires every search word to match (AND), across title, CWE and target name', () => {
    expect(applyQuery(findings, q({ text: 'acme cwe-89' }), ctx).matched.map((f) => f.id)).toEqual(['fnd_5231'])
  })

  it('filters by category code, CWE, target and scan', () => {
    expect(applyQuery(findings, q({ category: ['A10'] }), ctx).matched.every((f) => f.category.startsWith('A10'))).toBe(true)
    expect(applyQuery(findings, q({ cwe: ['CWE-79'] }), ctx).total).toBe(4)
    expect(applyQuery(findings, q({ target: ['tgt_01'] }), ctx).matched.every((f) => f.targetId === 'tgt_01')).toBe(true)
    expect(applyQuery(findings, q({ scan: ['scan_118'] }), ctx).total).toBe(8)
  })

  it('sorts severity by rank, not alphabetically', () => {
    const r = applyQuery(findings, q({ pageSize: 50 }), ctx)
    expect(r.rows[0]?.severity).toBe('critical')
    expect(r.rows.at(-1)?.severity).toBe('info')
  })

  it('applies multi-key sort with a stable tie-breaker', () => {
    const sorted = sortFindings(findings, [{ key: 'target', dir: 'asc' }, { key: 'severity', dir: 'desc' }], ctx)
    const pairs = sorted.map((f) => ctx.targetNames.get(f.targetId) ?? '')
    expect(pairs).toEqual([...pairs].sort((a, b) => a.localeCompare(b)))
    expect(sortFindings(findings, [{ key: 'cwe', dir: 'asc' }], ctx)).toEqual(sortFindings(findings, [{ key: 'cwe', dir: 'asc' }], ctx))
  })

  it('clamps the page when filters shrink the results', () => {
    const r = applyQuery(findings, q({ severity: ['info'], page: 9 }), ctx)
    expect(r.page).toBe(1)
    expect(r.rows.length).toBe(r.total)
  })

  it('returns an empty result, not an error, when nothing matches', () => {
    const r = applyQuery(findings, q({ text: 'zzz-no-match' }), ctx)
    expect(r.total).toBe(0)
    expect(r.rows).toEqual([])
    expect(r.pageCount).toBe(1)
  })
})

describe('facetCounts', () => {
  it('counts each facet ignoring its own filter but respecting the others', () => {
    const query = q({ severity: ['critical'], status: ['open'] })
    const counts = facetCounts(findings, query, ctx)
    const openOnly = findings.filter((f) => f.status === 'open')
    expect(counts.severity.high).toBe(openOnly.filter((f) => f.severity === 'high').length)
    const critOnly = findings.filter((f) => f.severity === 'critical')
    expect(counts.status.resolved).toBe(critOnly.filter((f) => f.status === 'resolved').length)
  })
})
