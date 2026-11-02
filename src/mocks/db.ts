import { isOpenStatus } from '@/lib/labels'
import type { Finding, FindingStatus, FindingsCount, Report, Scan, Target, TargetInput } from '@/types/domain'
import { createSeed, type DbState, type ScanRecord, type TargetRecord } from './data/seed'
import { VULNS } from './data/vulnerabilities'

/**
 * In-memory backend used by the MSW handlers.
 *
 * - The scan simulation is time-based: progress is computed from timestamps on every read ("tick"),
 *   so it keeps advancing across reloads and needs no background timers.
 * - Derived fields (openFindings, lastScannedAt, findingsCount) are computed on read, never stored,
 *   so they cannot drift out of sync with the findings they summarise.
 * - State is saved to sessionStorage, so mutations persist for the browser session like a real backend would.
 */

export const STORAGE_KEY = 'redcell:mockdb:v1'
/** How long a new scan waits in the queue before it starts running. */
export const QUEUE_DELAY_MS = 4_000

export class ApiFailure extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

interface DbOptions {
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
  now?: () => number
}

/** Small deterministic hash so generated findings are stable for a given scan ID. */
function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function createDb(options: DbOptions = {}) {
  const storage = options.storage === undefined ? safeSessionStorage() : options.storage
  const now = options.now ?? (() => Date.now())
  let state: DbState = load() ?? createSeed(now())

  function load(): DbState | null {
    try {
      const raw = storage?.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as DbState
      return parsed.version === 1 ? parsed : null
    } catch {
      return null
    }
  }

  function save() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or blocked: the mock keeps working in memory only.
    }
  }

  /* ---------- Scan simulation ---------- */

  /** Advances queued and running scans to where they should be at `t`. Returns true if anything changed. */
  function tick(t: number = now()): boolean {
    let changed = false
    for (const scan of state.scans) {
      if (scan.status === 'queued' && t >= Date.parse(scan.queuedAt) + QUEUE_DELAY_MS) {
        scan.status = 'running'
        scan.startedAt = new Date(Date.parse(scan.queuedAt) + QUEUE_DELAY_MS).toISOString()
        changed = true
      }
      if (scan.status === 'running' && scan.startedAt) {
        const elapsed = (t - Date.parse(scan.startedAt)) / 1000
        if (elapsed >= scan.plannedSec) {
          scan.status = 'completed'
          scan.durationSec = scan.plannedSec
          scan.progress = 100
          generateFindings(scan)
          changed = true
        }
      }
    }
    if (changed) save()
    return changed
  }

  /** When a simulated scan completes it "discovers" 3 to 5 findings the target does not already have. */
  function generateFindings(scan: ScanRecord) {
    const target = state.targets.find((t) => t.id === scan.targetId)
    if (!target) return
    const existing = new Set(state.findings.filter((f) => f.targetId === target.id).map((f) => f.title))
    const pool = VULNS.filter((v) => !existing.has(v.title))
    const seed = hash(scan.id)
    const count = Math.min(pool.length, 3 + (seed % 3))
    const start = Date.parse(scan.startedAt ?? new Date(now()).toISOString())
    for (let i = 0; i < count; i++) {
      const v = pool[(seed + i * 7) % pool.length]
      if (!v || existing.has(v.title)) continue
      existing.add(v.title)
      state.findings.push({
        id: `fnd_${state.seq.finding++}`,
        scanId: scan.id,
        targetId: target.id,
        title: v.title,
        severity: v.severity,
        category: v.category,
        cwe: v.cwe,
        status: 'open',
        location: v.location,
        description: v.description,
        evidence: v.evidence(new URL(target.url).host),
        remediation: v.remediation,
        discoveredAt: new Date(start + ((i + 1) * scan.plannedSec * 1000) / (count + 1)).toISOString(),
      })
    }
  }

  /* ---------- Projections: internal records -> contract shapes ---------- */

  function findingsCount(scanId: string): FindingsCount {
    const count: FindingsCount = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const f of state.findings) {
      if (f.scanId === scanId && f.severity !== 'info') count[f.severity]++
    }
    return count
  }

  function toScan(scan: ScanRecord, t: number): Scan {
    let progress = scan.progress
    let durationSec = scan.durationSec
    if (scan.status === 'running' && scan.startedAt) {
      const elapsed = Math.max(0, (t - Date.parse(scan.startedAt)) / 1000)
      progress = Math.min(99, Math.max(1, Math.floor((elapsed / scan.plannedSec) * 100)))
      durationSec = Math.floor(elapsed)
    }
    if (scan.status === 'queued') progress = 0
    return {
      id: scan.id,
      targetId: scan.targetId,
      status: scan.status,
      progress,
      startedAt: scan.startedAt,
      durationSec,
      findingsCount: findingsCount(scan.id),
    }
  }

  function toTarget(target: TargetRecord): Target {
    const finished = state.scans
      .filter((s) => s.targetId === target.id && (s.status === 'completed' || s.status === 'failed') && s.startedAt)
      .map((s) => Date.parse(s.startedAt as string) + (s.durationSec ?? 0) * 1000)
    const last = finished.length ? Math.max(...finished) : null
    return {
      id: target.id,
      name: target.name,
      url: target.url,
      environment: target.environment,
      authenticated: target.authenticated,
      lastScannedAt: last === null ? null : new Date(last).toISOString(),
      openFindings: state.findings.filter((f) => f.targetId === target.id && isOpenStatus(f.status)).length,
    }
  }

  function requireTarget(id: string): TargetRecord {
    const target = state.targets.find((t) => t.id === id)
    if (!target) throw new ApiFailure(404, `Target ${id} does not exist.`)
    return target
  }

  function requireFinding(id: string): Finding {
    const finding = state.findings.find((f) => f.id === id)
    if (!finding) throw new ApiFailure(404, `Finding ${id} does not exist.`)
    return finding
  }

  function assertUniqueUrl(url: string, exceptId?: string) {
    const normalised = url.replace(/\/+$/, '').toLowerCase()
    const clash = state.targets.find((t) => t.id !== exceptId && t.url.replace(/\/+$/, '').toLowerCase() === normalised)
    if (clash) throw new ApiFailure(409, `${clash.name} already uses this URL.`)
  }

  return {
    tick,

    reset(seedNow: number = now()) {
      state = createSeed(seedNow)
      save()
    },

    /* Targets */
    listTargets(): Target[] {
      tick()
      return state.targets.map(toTarget)
    },

    createTarget(input: TargetInput): Target {
      assertUniqueUrl(input.url)
      const record: TargetRecord = {
        id: `tgt_${String(state.seq.target++).padStart(2, '0')}`,
        name: input.name.trim(),
        url: input.url.trim(),
        environment: input.environment,
        authenticated: input.authenticated,
        username: input.authenticated ? (input.credentials?.username ?? null) : null,
        createdAt: new Date(now()).toISOString(),
      }
      state.targets.push(record)
      save()
      return toTarget(record)
    },

    updateTarget(id: string, input: TargetInput): Target {
      const target = requireTarget(id)
      assertUniqueUrl(input.url, id)
      target.name = input.name.trim()
      target.url = input.url.trim()
      target.environment = input.environment
      target.authenticated = input.authenticated
      target.username = input.authenticated ? (input.credentials?.username ?? target.username) : null
      save()
      return toTarget(target)
    },

    /** Removes a target together with its scans and findings. Reports are snapshots and are kept. */
    deleteTarget(id: string) {
      requireTarget(id)
      state.targets = state.targets.filter((t) => t.id !== id)
      state.scans = state.scans.filter((s) => s.targetId !== id)
      state.findings = state.findings.filter((f) => f.targetId !== id)
      save()
    },

    /* Scans */
    listScans(): Scan[] {
      tick()
      const t = now()
      return [...state.scans].sort((a, b) => Date.parse(b.queuedAt) - Date.parse(a.queuedAt)).map((s) => toScan(s, t))
    },

    createScan(targetId: string): Scan {
      tick()
      requireTarget(targetId)
      const busy = state.scans.find((s) => s.targetId === targetId && (s.status === 'queued' || s.status === 'running'))
      if (busy) throw new ApiFailure(409, `${busy.id} is already ${busy.status} for this target. Wait for it to finish.`)
      const record: ScanRecord = {
        id: `scan_${state.seq.scan++}`,
        targetId,
        status: 'queued',
        queuedAt: new Date(now()).toISOString(),
        startedAt: null,
        plannedSec: 45 + (hash(targetId + state.seq.scan) % 30),
        durationSec: null,
        progress: 0,
      }
      state.scans.push(record)
      save()
      return toScan(record, now())
    },

    /* Findings */
    listFindings(): Finding[] {
      tick()
      return state.findings.map((f) => ({ ...f }))
    },

    getFinding(id: string): Finding {
      tick()
      return { ...requireFinding(id) }
    },

    setFindingStatus(ids: string[], status: FindingStatus): Finding[] {
      const updated = ids.map((id) => {
        const finding = requireFinding(id)
        finding.status = status
        return { ...finding }
      })
      save()
      return updated
    },

    /* Reports */
    listReports(): Report[] {
      return [...state.reports].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    },

    createReport(scanId: string): Report {
      tick()
      const scan = state.scans.find((s) => s.id === scanId)
      if (!scan) throw new ApiFailure(404, `Scan ${scanId} does not exist.`)
      if (scan.status !== 'completed') throw new ApiFailure(409, `${scanId} has not completed, so there is nothing to report yet.`)
      const target = state.targets.find((t) => t.id === scan.targetId)
      const counts = findingsCount(scanId)
      const report: Report = {
        id: `rpt_${String(state.seq.report++).padStart(2, '0')}`,
        scanId,
        target: target?.name ?? 'Unknown',
        createdAt: new Date(now()).toISOString(),
        findings: counts.critical + counts.high + counts.medium + counts.low,
        format: 'pdf',
      }
      state.reports.push(report)
      save()
      return report
    },
  }
}

export type MockDb = ReturnType<typeof createDb>

function safeSessionStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}
