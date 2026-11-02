import { CloudOff, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

/**
 * Loading, empty and error states. Every data view uses these three so the states look and read the
 * same on every screen: a skeleton in the real layout, an illustrated empty state with one next step,
 * and a calm error with a plain reason and "Try again".
 */

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-shimmer rounded-md bg-surface-2', className)} />
}

/** Skeleton rows in the same geometry as the real table, so the layout does not jump when data lands. */
export function SkeletonRows({
  rows = 8,
  columns,
  label,
}: {
  rows?: number
  columns: string[]
  /** Read by screen readers, e.g. "Loading issues". */
  label: string
}) {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <span className="sr-only">{label}</span>
      <div aria-hidden>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
            {columns.map((w, c) => (
              <Skeleton key={c} className={cn('h-3.5', w)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** A quiet icon tile above the empty-state text. Decorative only. */
function EmptyIllustration({ icon }: { icon?: ReactNode }) {
  return (
    <div
      aria-hidden
      className="mb-1 grid size-12 place-items-center rounded-lg border border-line bg-surface-2 text-ink-2 [&_svg]:size-5"
    >
      {icon}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  detail?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, detail, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}>
      <EmptyIllustration icon={icon} />
      <p className="display text-[17px] font-semibold text-ink">{title}</p>
      {detail && <p className="max-w-md text-[14px] text-ink-2">{detail}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  /** What was being loaded, in plain words, e.g. "your reports". */
  resource: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({ error, resource, onRetry, retrying, className }: ErrorStateProps) {
  const detail = error instanceof Error ? error.message : null
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}>
      <div aria-hidden className="grid size-12 place-items-center rounded-lg bg-danger-soft text-danger">
        <CloudOff className="size-5" />
      </div>
      <p className="display text-[17px] font-semibold text-ink">Couldn&rsquo;t load {resource}</p>
      <p className="max-w-md text-[14px] text-ink-2">
        {detail ?? 'The request failed.'} Check your connection, then try again.
      </p>
      {onRetry && (
        <Button className="mt-2" onClick={onRetry} loading={retrying} icon={<RefreshCw aria-hidden />}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong bg-surface px-1 font-sans text-[11px] font-medium text-ink-2 shadow-sm">
      {children}
    </kbd>
  )
}
