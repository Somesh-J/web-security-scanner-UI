import type { Environment, Finding, FindingStatus, Report } from '@/types/domain'
import { vuln } from './vulnerabilities'

/**
 * Seed data for the mock backend. All timestamps are relative to `now`, so "last scanned 2h ago" and the
 * 30-day trend chart stay realistic whenever the app is opened.
 * Records named in the brief's data contract (tgt_01 Acme Store, scan_118, fnd_5231, rpt_09) are reproduced.
 */

export interface TargetRecord {
  id: string
  name: string
  url: string
  environment: Environment
  authenticated: boolean
  /** Stored, never returned by the API. Only the username is kept; the mock never stores passwords. */
  username: string | null
  createdAt: string
}

export interface ScanRecord {
  id: string
  targetId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  queuedAt: string
  startedAt: string | null
  /** How long the simulated scan takes once running. Internal to the mock. */
  plannedSec: number
  /** Set when the scan has finished (completed or failed). */
  durationSec: number | null
  /** Only meaningful for failed scans; running progress is computed from elapsed time. */
  progress: number
}

export interface DbState {
  version: 1
  targets: TargetRecord[]
  scans: ScanRecord[]
  findings: Finding[]
  reports: Report[]
  seq: { target: number; scan: number; finding: number; report: number }
}

const MIN = 60_000
const DAY = 24 * 60 * MIN

interface FindingSpec {
  key: string
  status: FindingStatus
  /** Minutes after scan start when the finding was discovered. */
  at: number
  id?: string
}

interface ScanSpec {
  id: string
  targetId: string
  daysAgo: number
  hour: number
  status: ScanRecord['status']
  durationSec: number
  progress?: number
  findings: FindingSpec[]
}

const TARGETS: Omit<TargetRecord, 'createdAt'>[] = [
  {
    id: 'tgt_01',
    name: 'Acme Store',
    url: 'https://shop.example.com',
    environment: 'staging',
    authenticated: true,
    username: 'qa-scanner',
  },
  {
    id: 'tgt_02',
    name: 'Billing API',
    url: 'https://api.billing.example.com',
    environment: 'production',
    authenticated: true,
    username: 'svc-clearsite',
  },
  {
    id: 'tgt_03',
    name: 'Partner Portal',
    url: 'https://partners.example.com',
    environment: 'production',
    authenticated: true,
    username: 'partner01',
  },
  {
    id: 'tgt_04',
    name: 'Marketing Site',
    url: 'https://www.example.com',
    environment: 'production',
    authenticated: false,
    username: null,
  },
  {
    id: 'tgt_05',
    name: 'Docs Portal',
    url: 'https://docs.example.com',
    environment: 'staging',
    authenticated: false,
    username: null,
  },
  {
    id: 'tgt_06',
    name: 'Mobile Gateway',
    url: 'https://gw.dev.example.com',
    environment: 'dev',
    authenticated: true,
    username: 'mobile-ci',
  },
  {
    id: 'tgt_07',
    name: 'Admin Console',
    url: 'https://admin.staging.example.com',
    environment: 'staging',
    authenticated: true,
    username: 'pentest',
  },
  {
    id: 'tgt_08',
    name: 'Careers Site',
    url: 'https://careers.example.com',
    environment: 'production',
    authenticated: false,
    username: null,
  },
]

const SCANS: ScanSpec[] = [
  {
    id: 'scan_101',
    targetId: 'tgt_04',
    daysAgo: 27,
    hour: 8,
    status: 'completed',
    durationSec: 512,
    findings: [
      { key: 'xss-contact', status: 'resolved', at: 3 },
      { key: 'tls-cert', status: 'resolved', at: 1 },
      { key: 'email-disclosure', status: 'false_positive', at: 5 },
    ],
  },
  {
    id: 'scan_103',
    targetId: 'tgt_05',
    daysAgo: 24,
    hour: 14,
    status: 'completed',
    durationSec: 905,
    findings: [
      { key: 'log4shell', status: 'resolved', at: 6 },
      { key: 'ssti-search', status: 'confirmed', at: 9 },
      { key: 'reset-token-url', status: 'open', at: 12 },
    ],
  },
  {
    id: 'scan_105',
    targetId: 'tgt_01',
    daysAgo: 20,
    hour: 9,
    status: 'completed',
    durationSec: 688,
    findings: [
      { key: 'idor-orders', status: 'resolved', at: 4 },
      { key: 'csp-missing', status: 'open', at: 1 },
      { key: 'verbose-errors', status: 'resolved', at: 7 },
      { key: 'hsts-missing', status: 'open', at: 1 },
    ],
  },
  {
    id: 'scan_107',
    targetId: 'tgt_06',
    daysAgo: 16,
    hour: 11,
    status: 'failed',
    durationSec: 94,
    progress: 23,
    findings: [],
  },
  {
    id: 'scan_109',
    targetId: 'tgt_03',
    daysAgo: 13,
    hour: 10,
    status: 'completed',
    durationSec: 1340,
    findings: [
      { key: 'ssrf-webhook', status: 'confirmed', at: 14 },
      { key: 'xxe-import', status: 'open', at: 18 },
      { key: 'session-fixation', status: 'open', at: 3 },
      { key: 'password-policy', status: 'false_positive', at: 2 },
      { key: 'user-enum', status: 'open', at: 2 },
      { key: 'deserialization', status: 'resolved', at: 9 },
    ],
  },
  {
    id: 'scan_111',
    targetId: 'tgt_02',
    daysAgo: 10,
    hour: 7,
    status: 'completed',
    durationSec: 1105,
    findings: [
      { key: 'bola-invoices', status: 'confirmed', at: 8 },
      { key: 'jwt-none', status: 'resolved', at: 5 },
      { key: 'mass-assignment', status: 'confirmed', at: 11 },
      { key: 'rate-limit', status: 'open', at: 15 },
      { key: 'tls-weak', status: 'open', at: 1 },
      { key: 'audit-log', status: 'open', at: 16 },
      { key: 'cors-wildcard', status: 'confirmed', at: 2 },
    ],
  },
  {
    id: 'scan_113',
    targetId: 'tgt_07',
    daysAgo: 7,
    hour: 16,
    status: 'completed',
    durationSec: 980,
    findings: [
      { key: 'default-creds', status: 'resolved', at: 1 },
      { key: 'path-traversal', status: 'confirmed', at: 6 },
      { key: 'cmd-injection', status: 'open', at: 9 },
      { key: 'clickjacking', status: 'open', at: 2 },
      { key: 'log-injection', status: 'open', at: 4 },
      { key: 'dir-listing', status: 'resolved', at: 3 },
      { key: 'debug-endpoint', status: 'open', at: 1 },
    ],
  },
  {
    id: 'scan_114',
    targetId: 'tgt_06',
    daysAgo: 5,
    hour: 13,
    status: 'completed',
    durationSec: 761,
    findings: [
      { key: 'ssrf-image', status: 'open', at: 7 },
      { key: 'hardcoded-key', status: 'confirmed', at: 1 },
      { key: 'graphql-introspection', status: 'open', at: 2 },
      { key: 'nosql-injection', status: 'open', at: 5 },
      { key: 'missing-auth', status: 'open', at: 3 },
    ],
  },
  {
    id: 'scan_116',
    targetId: 'tgt_04',
    daysAgo: 3,
    hour: 10,
    status: 'completed',
    durationSec: 433,
    findings: [
      { key: 'wp-plugin', status: 'open', at: 2 },
      { key: 'sri-missing', status: 'open', at: 1 },
      { key: 'xss-dom', status: 'open', at: 4 },
      { key: 'mixed-content', status: 'open', at: 3 },
      { key: 'robots-disclosure', status: 'open', at: 1 },
    ],
  },
  {
    id: 'scan_118',
    targetId: 'tgt_01',
    daysAgo: 1,
    hour: 9,
    status: 'completed',
    durationSec: 742,
    findings: [
      { key: 'sqli-search', status: 'open', at: 6, id: 'fnd_5231' },
      { key: 'xss-reflected', status: 'open', at: 4 },
      { key: 'xss-stored', status: 'confirmed', at: 8 },
      { key: 'csrf-profile', status: 'open', at: 3 },
      { key: 'open-redirect', status: 'open', at: 2 },
      { key: 'jquery-outdated', status: 'open', at: 1 },
      { key: 'cookie-httponly', status: 'resolved', at: 1 },
      { key: 'server-banner', status: 'open', at: 0 },
    ],
  },
]

/** Start of a UTC day `daysAgo` before now, at `hour`:00. */
function dayAt(now: number, daysAgo: number, hour: number): number {
  const d = new Date(now - daysAgo * DAY)
  d.setUTCHours(hour, 0, 0, 0)
  return d.getTime()
}

function hostOf(url: string): string {
  return new URL(url).host
}

export function createSeed(now: number = Date.now()): DbState {
  const targets: TargetRecord[] = TARGETS.map((t, i) => ({
    ...t,
    createdAt: new Date(dayAt(now, 40 - i, 9)).toISOString(),
  }))
  const hostById = new Map(targets.map((t) => [t.id, hostOf(t.url)]))

  const scans: ScanRecord[] = []
  const findings: Finding[] = []
  let findingSeq = 5201

  for (const spec of SCANS) {
    const start = dayAt(now, spec.daysAgo, spec.hour)
    scans.push({
      id: spec.id,
      targetId: spec.targetId,
      status: spec.status,
      queuedAt: new Date(start - 2 * MIN).toISOString(),
      startedAt: new Date(start).toISOString(),
      plannedSec: spec.durationSec,
      durationSec: spec.durationSec,
      progress: spec.progress ?? 100,
    })
    for (const f of spec.findings) {
      const v = vuln(f.key)
      let id = f.id
      if (!id) {
        if (findingSeq === 5231) findingSeq++ // reserved for the contract example record
        id = `fnd_${findingSeq++}`
      }
      findings.push({
        id,
        scanId: spec.id,
        targetId: spec.targetId,
        title: v.title,
        severity: v.severity,
        category: v.category,
        cwe: v.cwe,
        status: f.status,
        location: v.location,
        description: v.description,
        evidence: v.evidence(hostById.get(spec.targetId) ?? 'example.com'),
        remediation: v.remediation,
        discoveredAt: new Date(start + f.at * MIN).toISOString(),
      })
    }
  }

  // A scan running right now (about 45% through) and one waiting in the queue, so the Scans screen is live.
  scans.push({
    id: 'scan_119',
    targetId: 'tgt_02',
    status: 'running',
    queuedAt: new Date(now - 5 * MIN).toISOString(),
    startedAt: new Date(now - 4 * MIN).toISOString(),
    plannedSec: 540,
    durationSec: null,
    progress: 0,
  })
  scans.push({
    id: 'scan_120',
    targetId: 'tgt_05',
    status: 'queued',
    queuedAt: new Date(now).toISOString(),
    startedAt: null,
    plannedSec: 150,
    durationSec: null,
    progress: 0,
  })

  const reportFor = (id: string, scanId: string, hoursAfter: number): Report => {
    const scan = scans.find((s) => s.id === scanId)
    const target = targets.find((t) => t.id === scan?.targetId)
    const count = findings.filter((f) => f.scanId === scanId && f.severity !== 'info').length
    const created = new Date(scan?.startedAt ?? now).getTime() + hoursAfter * 60 * MIN
    return {
      id,
      scanId,
      target: target?.name ?? 'Unknown',
      createdAt: new Date(created).toISOString(),
      findings: count,
      format: 'pdf',
    }
  }

  const reports: Report[] = [
    reportFor('rpt_06', 'scan_109', 2),
    reportFor('rpt_07', 'scan_111', 1),
    reportFor('rpt_08', 'scan_113', 3),
    reportFor('rpt_09', 'scan_118', 1),
  ]

  return {
    version: 1,
    targets,
    scans,
    findings,
    reports,
    seq: { target: 9, scan: 121, finding: findingSeq, report: 10 },
  }
}
