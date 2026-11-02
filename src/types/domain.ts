/**
 * Domain types. These mirror the backend data contract (assignment brief, section 5) field for field.
 * Anything the UI derives (labels, counts, sort keys) lives elsewhere, so this file stays a pure contract.
 */

export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const
export type Severity = (typeof SEVERITIES)[number]

export const FINDING_STATUSES = ['open', 'confirmed', 'resolved', 'false_positive'] as const
export type FindingStatus = (typeof FINDING_STATUSES)[number]

export const SCAN_STATUSES = ['queued', 'running', 'completed', 'failed'] as const
export type ScanStatus = (typeof SCAN_STATUSES)[number]

export const ENVIRONMENTS = ['production', 'staging', 'dev'] as const
export type Environment = (typeof ENVIRONMENTS)[number]

/** OWASP Top 10 (2021) labels, in the exact "A03: Injection" format the contract uses. */
export const OWASP_CATEGORIES = [
  'A01: Broken Access Control',
  'A02: Cryptographic Failures',
  'A03: Injection',
  'A04: Insecure Design',
  'A05: Security Misconfiguration',
  'A06: Vulnerable and Outdated Components',
  'A07: Identification and Authentication Failures',
  'A08: Software and Data Integrity Failures',
  'A09: Security Logging and Monitoring Failures',
  'A10: Server-Side Request Forgery',
] as const
export type OwaspCategory = (typeof OWASP_CATEGORIES)[number]

export interface Target {
  id: string
  name: string
  url: string
  environment: Environment
  authenticated: boolean
  lastScannedAt: string | null
  openFindings: number
}

/** The contract shows findingsCount without "info"; info findings are counted in the findings list only. */
export type FindingsCount = Record<Exclude<Severity, 'info'>, number>

export interface Scan {
  id: string
  targetId: string
  status: ScanStatus
  progress: number
  startedAt: string | null
  durationSec: number | null
  findingsCount: FindingsCount
}

export interface Evidence {
  request: string
  response: string
}

export interface Finding {
  id: string
  scanId: string
  targetId: string
  title: string
  severity: Severity
  category: OwaspCategory
  cwe: string
  status: FindingStatus
  location: string
  description: string
  evidence: Evidence
  remediation: string
  discoveredAt: string
}

export interface Report {
  id: string
  scanId: string
  target: string
  createdAt: string
  findings: number
  format: 'pdf'
}

/* ---------- Request payloads (write side of the API) ---------- */

export interface TargetInput {
  name: string
  url: string
  environment: Environment
  authenticated: boolean
  /** Only sent when authenticated is true. Never returned by the API. */
  credentials?: { username: string; password: string }
}

export interface LoginInput {
  email: string
  password: string
}

export interface Session {
  token: string
  user: { name: string; email: string; role: string }
}
