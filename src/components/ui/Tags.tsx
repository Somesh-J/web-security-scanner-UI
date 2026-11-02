import { cn } from '@/lib/cn'
import { SEV_TEXT } from './severityStyles'
import { ENV_LABEL, ENV_TAG, SEVERITY_LABEL, SEVERITY_TAG, STATUS_LABEL } from '@/lib/labels'
import type { Environment, FindingsCount, FindingStatus, Severity } from '@/types/domain'

/**
 * Severity, status and environment markers.
 * None of them rely on colour alone: severity is a fixed-width text tag (like nuclei's [critical]),
 * status is a glyph plus a word. This keeps them readable for colour-blind users and in greyscale.
 */

export function SeverityTag({ severity, className }: { severity: Severity; className?: string }) {
  const tag = SEVERITY_TAG[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs font-mono text-[12px] leading-none font-semibold whitespace-pre',
        SEV_TEXT[severity],
        // Only critical gets a filled background, so the most urgent row also differs by shape.
        severity === 'critical' ? 'bg-sev-critical/12 px-1 py-[3px] ring-1 ring-sev-critical/40' : 'py-[3px]',
        className,
      )}
    >
      <span aria-hidden>[{tag.padEnd(4, ' ')}]</span>
      <span className="sr-only">{SEVERITY_LABEL[severity]} severity</span>
    </span>
  )
}

const STATUS_GLYPH: Record<FindingStatus, string> = {
  open: '○',
  confirmed: '●',
  resolved: '✓',
  false_positive: '⊘',
}
const STATUS_TONE: Record<FindingStatus, string> = {
  open: 'text-bone',
  confirmed: 'text-signal',
  resolved: 'text-clear',
  false_positive: 'text-smoke',
}

export function StatusMark({ status, className }: { status: FindingStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[12px] whitespace-nowrap',
        STATUS_TONE[status],
        className,
      )}
    >
      <span aria-hidden className="w-3 text-center">
        {STATUS_GLYPH[status]}
      </span>
      <span className={cn(status === 'false_positive' && 'line-through decoration-smoke/70')}>
        {STATUS_LABEL[status]}
      </span>
    </span>
  )
}

const ENV_TONE: Record<Environment, string> = {
  production: 'text-signal border-signal/50',
  staging: 'text-sev-high border-sev-high/50',
  dev: 'text-ash border-wire-2',
}

export function EnvTag({ environment }: { environment: Environment }) {
  return (
    <span
      title={ENV_LABEL[environment]}
      className={cn(
        'inline-flex rounded-xs border px-1.5 py-px font-mono text-[11px] font-semibold tracking-wider',
        ENV_TONE[environment],
      )}
    >
      <span aria-hidden>{ENV_TAG[environment]}</span>
      <span className="sr-only">{ENV_LABEL[environment]}</span>
    </span>
  )
}

/** "CRIT 1 HIGH 2 MED 3 LOW 1" — a compact severity breakdown for scans and reports. Zero counts are dimmed. */
export function SeverityStrip({ counts, className }: { counts: FindingsCount; className?: string }) {
  const order: (keyof FindingsCount)[] = ['critical', 'high', 'medium', 'low']
  const total = order.reduce((n, k) => n + counts[k], 0)
  if (total === 0)
    return <span className={cn('font-mono text-[12px] text-smoke', className)}>no findings</span>
  return (
    <span
      className={cn('inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[12px]', className)}
    >
      {order.map((sev) => (
        <span key={sev} className={cn('whitespace-nowrap', counts[sev] === 0 && 'opacity-40')}>
          <span className="text-ash">{SEVERITY_TAG[sev]}</span>{' '}
          <span className={cn('tabular font-semibold', counts[sev] > 0 ? SEV_TEXT[sev] : 'text-smoke')}>
            {counts[sev]}
          </span>
        </span>
      ))}
    </span>
  )
}
