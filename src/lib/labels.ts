import type { Environment, FindingStatus, OwaspCategory, ScanStatus, Severity } from '@/types/domain'

/**
 * Friendly, plain-language labels. The data contract keeps its enums (`false_positive`, `critical` ...);
 * only what the user reads changes here (docs/DESIGN-v2.md §1).
 */

/** Higher number = more severe. Used for sorting and "worst severity" logic. */
export const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
}

export const SEVERITY_HELP: Record<Severity, string> = {
  critical: 'Can be exploited easily and cause serious damage. Fix now.',
  high: 'Serious risk. Fix this week.',
  medium: 'Real risk under some conditions. Plan a fix.',
  low: 'Minor risk. Fix when convenient.',
  info: 'Not a risk on its own. Good to know.',
}

export const STATUS_LABEL: Record<FindingStatus, string> = {
  open: 'New',
  confirmed: 'Confirmed',
  resolved: 'Fixed',
  false_positive: 'Not an issue',
}

export const STATUS_HELP: Record<FindingStatus, string> = {
  open: 'Found by a scan, not reviewed yet.',
  confirmed: "You checked it and it's a real problem.",
  resolved: 'The problem has been fixed.',
  false_positive: "You checked it and it isn't a real problem.",
}

/** Workflow order for sorting by status: things needing action first. */
export const STATUS_RANK: Record<FindingStatus, number> = {
  open: 0,
  confirmed: 1,
  resolved: 2,
  false_positive: 3,
}

export const SCAN_STATUS_LABEL: Record<ScanStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
}

export const ENV_LABEL: Record<Environment, string> = {
  production: 'Production',
  staging: 'Staging',
  dev: 'Development',
}

export const ENV_HELP: Record<Environment, string> = {
  production: 'Your live site that customers use.',
  staging: 'A test copy of your site, before going live.',
  dev: 'A development build only your team uses.',
}

/** "A03: Injection" -> "A03" */
export function categoryCode(category: OwaspCategory): string {
  return category.slice(0, 3)
}

/** "A03: Injection" -> "Injection" */
export function categoryName(category: OwaspCategory): string {
  return category.slice(5)
}

/** A finding counts as "open" for dashboards and targets while it still needs action. */
export function isOpenStatus(status: FindingStatus): boolean {
  return status === 'open' || status === 'confirmed'
}

export const JARGON = {
  owasp:
    'OWASP Top 10 is a widely used list of the most common kinds of website security problems. The code (like A03) tells you which group this issue belongs to.',
  cwe: 'CWE is the standard ID for this type of weakness. Security teams and developers use it to look up details and fixes.',
  evidence:
    'This is the exact request our scanner sent and what your site answered. It proves the issue is real and helps a developer reproduce it. You don’t need to read it to fix the issue.',
} as const
