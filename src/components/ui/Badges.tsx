import {
  CircleCheck,
  CircleDot,
  CircleSlash,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { SEV_BADGE, SEVERITY_ICON } from './severityStyles'
import { ENV_LABEL, SEVERITY_HELP, SEVERITY_LABEL, STATUS_HELP, STATUS_LABEL } from '@/lib/labels'
import type { Environment, FindingsCount, FindingStatus, Severity } from '@/types/domain'

/**
 * Severity, status and environment badges.
 * Severity and status are always icon + word + colour, never colour alone (WCAG 1.4.1).
 * Environment is deliberately neutral so it never competes with severity colours.
 */

const pill =
  'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12.5px] font-medium whitespace-nowrap'

export function SeverityBadge({
  severity,
  className,
  size = 'md',
}: {
  severity: Severity
  className?: string
  size?: 'md' | 'lg'
}) {
  const Icon = SEVERITY_ICON[severity]
  return (
    <span
      title={SEVERITY_HELP[severity]}
      className={cn(pill, SEV_BADGE[severity], size === 'lg' && 'px-3 py-1 text-[13.5px]', className)}
    >
      <Icon aria-hidden className={size === 'lg' ? 'size-4' : 'size-3.5'} strokeWidth={2.25} />
      {SEVERITY_LABEL[severity]}
      <span className="sr-only"> severity</span>
    </span>
  )
}

const STATUS_ICON: Record<FindingStatus, LucideIcon> = {
  open: CircleDot,
  confirmed: TriangleAlert,
  resolved: CircleCheck,
  false_positive: CircleSlash,
}

const STATUS_TONE: Record<FindingStatus, string> = {
  open: 'bg-brand-soft text-brand-text',
  confirmed: 'bg-sev-high-soft text-sev-high',
  resolved: 'bg-success-soft text-success',
  false_positive: 'bg-surface-2 text-ink-2',
}

export function StatusBadge({ status, className }: { status: FindingStatus; className?: string }) {
  const Icon = STATUS_ICON[status]
  return (
    <span title={STATUS_HELP[status]} className={cn(pill, STATUS_TONE[status], className)}>
      <Icon aria-hidden className="size-3.5" strokeWidth={2.25} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function EnvBadge({ environment, className }: { environment: Environment; className?: string }) {
  return (
    <span
      className={cn(
        pill,
        'border',
        environment === 'production'
          ? 'border-ink/15 bg-ink text-surface'
          : environment === 'staging'
            ? 'border-line-strong bg-surface-2 text-ink'
            : 'border-line-strong bg-surface text-ink-2',
        className,
      )}
    >
      {environment === 'production' && <ShieldCheck aria-hidden className="size-3.5" />}
      {ENV_LABEL[environment]}
    </span>
  )
}

/**
 * Compact severity breakdown for scans, websites and reports: "⬣ 1  ▲ 2  ◆ 3".
 * Each count has its icon and an accessible label; zero counts are hidden.
 */
export function SeverityCounts({
  counts,
  className,
  emptyLabel = 'No issues found',
}: {
  counts: FindingsCount
  className?: string
  emptyLabel?: string
}) {
  const order: (keyof FindingsCount)[] = ['critical', 'high', 'medium', 'low']
  const shown = order.filter((k) => counts[k] > 0)
  if (shown.length === 0)
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-success', className)}>
        <CircleCheck aria-hidden className="size-3.5" />
        {emptyLabel}
      </span>
    )
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      {shown.map((sev) => {
        const Icon = SEVERITY_ICON[sev]
        return (
          <span
            key={sev}
            title={`${counts[sev]} ${SEVERITY_LABEL[sev]}`}
            className={cn(
              'tabular inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12.5px] font-semibold',
              SEV_BADGE[sev],
            )}
          >
            <Icon aria-hidden className="size-3" strokeWidth={2.5} />
            {counts[sev]}
            <span className="sr-only"> {SEVERITY_LABEL[sev]}</span>
          </span>
        )
      })}
    </span>
  )
}
