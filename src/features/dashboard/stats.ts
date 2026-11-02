import { isOpenStatus } from '@/lib/labels'
import { SEVERITIES, type Finding, type Severity } from '@/types/domain'

/** Pure aggregations behind the dashboard charts. Kept out of components so they are unit-testable. */

export type SeverityCounts = Record<Severity, number>

export function emptyCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
}

export function openBySeverity(findings: Finding[]): SeverityCounts {
  const counts = emptyCounts()
  for (const f of findings) if (isOpenStatus(f.status)) counts[f.severity]++
  return counts
}

export interface DayBucket {
  /** UTC date, YYYY-MM-DD. */
  date: string
  counts: SeverityCounts
  total: number
}

/** New findings per UTC day for the last `days` days (oldest first), split by severity. */
export function findingsPerDay(findings: Finding[], days: number, now: number = Date.now()): DayBucket[] {
  const end = new Date(now)
  end.setUTCHours(0, 0, 0, 0)
  const buckets: DayBucket[] = []
  const index = new Map<string, DayBucket>()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end.getTime() - i * 86_400_000).toISOString().slice(0, 10)
    const bucket = { date, counts: emptyCounts(), total: 0 }
    buckets.push(bucket)
    index.set(date, bucket)
  }
  for (const f of findings) {
    const bucket = index.get(f.discoveredAt.slice(0, 10))
    if (!bucket) continue
    bucket.counts[f.severity]++
    bucket.total++
  }
  return buckets
}

/** Severity order for stacking: most severe at the bottom of a column, nearest the baseline. */
export const STACK_ORDER: Severity[] = [...SEVERITIES]

/** Open findings discovered in the last `days` days. Drives the "+N this week" hint on the Overview. */
export function openSince(findings: Finding[], days: number, now: number = Date.now()): number {
  const from = now - days * 86_400_000
  return findings.filter((f) => isOpenStatus(f.status) && new Date(f.discoveredAt).getTime() >= from).length
}

export interface ChecklistInput {
  targets: number
  scans: number
  /** True once any finding has left the "open" (new) status, i.e. the user has reviewed one. */
  reviewed: boolean
  reports: number
}

export type ChecklistStepId = 'website' | 'scan' | 'review' | 'report'

/** The brief's workflow as four "Get started" steps, each derived from real data. */
export function checklistSteps(input: ChecklistInput): Record<ChecklistStepId, boolean> {
  return {
    website: input.targets > 0,
    scan: input.scans > 0,
    review: input.reviewed,
    report: input.reports > 0,
  }
}
