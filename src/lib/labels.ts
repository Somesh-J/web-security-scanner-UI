import type { Environment, FindingStatus, OwaspCategory, ScanStatus, Severity } from '@/types/domain'

/** Higher number = more severe. Used for sorting and "worst severity" logic. */
export const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }

/** Fixed-width tags in the style of offensive CLI tools (nuclei prints [critical], [high] ...). */
export const SEVERITY_TAG: Record<Severity, string> = {
  critical: 'CRIT',
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
  info: 'INFO',
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
}

export const STATUS_LABEL: Record<FindingStatus, string> = {
  open: 'open',
  confirmed: 'confirmed',
  resolved: 'resolved',
  false_positive: 'false positive',
}

/** Workflow order for sorting by status: things needing action first. */
export const STATUS_RANK: Record<FindingStatus, number> = {
  open: 0,
  confirmed: 1,
  resolved: 2,
  false_positive: 3,
}

export const SCAN_STATUS_LABEL: Record<ScanStatus, string> = {
  queued: 'QUEUED',
  running: 'RUNNING',
  completed: 'DONE',
  failed: 'FAILED',
}

export const ENV_TAG: Record<Environment, string> = { production: 'PRD', staging: 'STG', dev: 'DEV' }
export const ENV_LABEL: Record<Environment, string> = {
  production: 'Production',
  staging: 'Staging',
  dev: 'Development',
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
