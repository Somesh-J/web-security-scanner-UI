import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

/**
 * Loading, empty and error states, written in the console's log voice.
 * Every data view uses these three so the states look and read the same on every screen.
 */

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-shimmer rounded-xs bg-panel-2', className)} />
}

/** Skeleton rows in the same geometry as the real table, so the layout does not jump when data lands. */
export function SkeletonRows({
  rows = 8,
  columns,
  label,
}: {
  rows?: number
  columns: string[]
  label: string
}) {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <p className="border-b border-wire px-4 py-2 font-mono text-[12px] text-ash">
        <span className="text-live">&gt;</span> {label}
        <span className="ml-0.5 inline-block animate-blink">_</span>
      </p>
      <div aria-hidden>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-4 border-b border-wire px-4 py-3">
            {columns.map((w, c) => (
              <Skeleton key={c} className={cn('h-3', w)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  /** One line in log voice, e.g. "0 findings match sev:crit cwe:22". */
  title: string
  detail?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, detail, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-start gap-3 px-6 py-12 sm:items-center sm:text-center', className)}
    >
      <p className="font-mono text-[13px] text-bone">
        <span className="text-smoke">$ </span>
        {title}
      </p>
      {detail && <p className="max-w-md text-[13px] text-ash">{detail}</p>}
      {action}
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  /** What was being loaded, e.g. "/api/reports". */
  resource: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({ error, resource, onRetry, retrying, className }: ErrorStateProps) {
  const status =
    typeof error === 'object' && error && 'status' in error ? (error as { status: number }).status : null
  const message = error instanceof Error ? error.message : 'The request failed.'
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-start gap-3 px-6 py-12 sm:items-center sm:text-center', className)}
    >
      <p className="font-mono text-[13px] text-signal">
        ERR {status ? `${status} ` : ''}
        <span className="text-ash">{resource}</span>
      </p>
      <p className="max-w-md text-[13px] text-bone">{message}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry} loading={retrying}>
          Retry
        </Button>
      )}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded-xs border border-b-2 border-wire-2 px-1 font-mono text-[10.5px] text-ash">
      {children}
    </kbd>
  )
}
