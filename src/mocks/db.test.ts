import { describe, expect, it } from 'vitest'
import { ApiFailure, createDb, QUEUE_DELAY_MS } from './db'

function clockedDb(start = Date.parse('2026-11-02T12:00:00Z')) {
  let t = start
  const db = createDb({ storage: null, now: () => t })
  return { db, advance: (ms: number) => (t += ms) }
}

describe('mock database', () => {
  it('meets the minimum sample sizes from the brief', () => {
    const { db } = clockedDb()
    expect(db.listTargets().length).toBeGreaterThanOrEqual(6)
    expect(db.listScans().length).toBeGreaterThanOrEqual(10)
    expect(db.listFindings().length).toBeGreaterThanOrEqual(40)
  })

  it('derives openFindings and findingsCount from the findings themselves', () => {
    const { db } = clockedDb()
    const acme = db.listTargets().find((t) => t.id === 'tgt_01')
    const open = db
      .listFindings()
      .filter((f) => f.targetId === 'tgt_01' && (f.status === 'open' || f.status === 'confirmed'))
    expect(acme?.openFindings).toBe(open.length)
    const scan118 = db.listScans().find((s) => s.id === 'scan_118')
    expect(scan118?.findingsCount).toEqual({ critical: 1, high: 2, medium: 3, low: 1 })
  })

  it('moves a new scan from queued to running to completed over time, then adds findings', () => {
    const { db, advance } = clockedDb()
    const before = db.listFindings().filter((f) => f.targetId === 'tgt_08').length
    const scan = db.createScan('tgt_08')
    expect(scan.status).toBe('queued')

    advance(QUEUE_DELAY_MS + 10_000)
    const running = db.listScans().find((s) => s.id === scan.id)
    expect(running?.status).toBe('running')
    expect(running?.progress).toBeGreaterThan(0)
    expect(running?.progress).toBeLessThan(100)

    advance(5 * 60_000)
    const done = db.listScans().find((s) => s.id === scan.id)
    expect(done?.status).toBe('completed')
    expect(done?.progress).toBe(100)
    expect(db.listFindings().filter((f) => f.targetId === 'tgt_08').length).toBeGreaterThan(before)
    expect(db.listTargets().find((t) => t.id === 'tgt_08')?.lastScannedAt).not.toBeNull()
  })

  it('refuses a second scan while one is active for the same target', () => {
    const { db } = clockedDb()
    expect(() => db.createScan('tgt_02')).toThrow(ApiFailure)
  })

  it('rejects duplicate target URLs and unknown IDs', () => {
    const { db } = clockedDb()
    const input = {
      name: 'Dup',
      url: 'https://shop.example.com/',
      environment: 'dev' as const,
      authenticated: false,
    }
    expect(() => db.createTarget(input)).toThrow(/already uses this URL/)
    expect(() => db.updateTarget('tgt_99', input)).toThrow(/does not exist/)
  })

  it('cascades target removal to its scans and findings', () => {
    const { db } = clockedDb()
    db.deleteTarget('tgt_01')
    expect(db.listScans().some((s) => s.targetId === 'tgt_01')).toBe(false)
    expect(db.listFindings().some((f) => f.targetId === 'tgt_01')).toBe(false)
  })

  it('only generates reports for completed scans', () => {
    const { db } = clockedDb()
    expect(db.createReport('scan_118')).toMatchObject({
      scanId: 'scan_118',
      target: 'Acme Store',
      findings: 7,
      format: 'pdf',
    })
    expect(() => db.createReport('scan_107')).toThrow(/has not completed/)
  })

  it('updates finding status in bulk', () => {
    const { db } = clockedDb()
    const updated = db.setFindingStatus(['fnd_5231', 'fnd_5201'], 'confirmed')
    expect(updated.map((f) => f.status)).toEqual(['confirmed', 'confirmed'])
    expect(db.getFinding('fnd_5231').status).toBe('confirmed')
  })
})
