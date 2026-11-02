import { describe, expect, it } from 'vitest'
import { createSeed } from '@/mocks/data/seed'
import { findingsPerDay, openBySeverity } from './stats'

const NOW = Date.parse('2026-11-02T12:00:00Z')
const seed = createSeed(NOW)

describe('dashboard stats', () => {
  it('counts only open and confirmed findings by severity', () => {
    const counts = openBySeverity(seed.findings)
    const expected = seed.findings.filter((f) => f.status === 'open' || f.status === 'confirmed').length
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(expected)
  })

  it('buckets findings into UTC days, oldest first, ending today', () => {
    const days = findingsPerDay(seed.findings, 30, NOW)
    expect(days).toHaveLength(30)
    expect(days.at(-1)?.date).toBe('2026-11-02')
    expect(days[0]?.date).toBe('2026-10-04')
    const total = days.reduce((n, d) => n + d.total, 0)
    expect(total).toBe(seed.findings.length)
    for (const d of days) expect(Object.values(d.counts).reduce((a, b) => a + b, 0)).toBe(d.total)
  })
})
