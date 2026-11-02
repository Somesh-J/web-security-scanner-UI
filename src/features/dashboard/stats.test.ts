import { describe, expect, it } from 'vitest'
import { createSeed } from '@/mocks/data/seed'
import { checklistSteps, findingsPerDay, openBySeverity, openSince } from './stats'

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

describe('openSince', () => {
  it('counts only open findings discovered inside the window', () => {
    const week = openSince(seed.findings, 7, NOW)
    const expected = seed.findings.filter(
      (f) =>
        (f.status === 'open' || f.status === 'confirmed') &&
        Date.parse(f.discoveredAt) >= NOW - 7 * 86_400_000,
    ).length
    expect(week).toBe(expected)
    expect(openSince(seed.findings, 0, NOW)).toBe(0)
  })
})

describe('checklistSteps', () => {
  it('marks each step done from real data', () => {
    expect(checklistSteps({ targets: 0, scans: 0, reviewed: false, reports: 0 })).toEqual({
      website: false,
      scan: false,
      review: false,
      report: false,
    })
    expect(checklistSteps({ targets: 2, scans: 1, reviewed: true, reports: 3 })).toEqual({
      website: true,
      scan: true,
      review: true,
      report: true,
    })
  })
})
