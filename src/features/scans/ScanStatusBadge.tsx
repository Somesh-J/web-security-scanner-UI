import { CircleCheck, CircleX, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SCAN_STATUS_LABEL } from '@/lib/labels'
import type { ScanStatus } from '@/types/domain'

const TONE: Record<ScanStatus, string> = {
  queued: 'bg-surface-2 text-ink-2',
  running: 'bg-brand-soft text-brand-text',
  completed: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
}

/** Scan state as icon + word. Running has a gently pulsing dot: the only pulsing element in the app. */
export function ScanStatusBadge({ status, className }: { status: ScanStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12.5px] font-medium whitespace-nowrap',
        TONE[status],
        className,
      )}
    >
      {status === 'running' ? (
        <span aria-hidden className="mx-0.5 size-2 rounded-full bg-brand" />
      ) : status === 'queued' ? (
        <Clock aria-hidden className="size-3.5" />
      ) : status === 'completed' ? (
        <CircleCheck aria-hidden className="size-3.5" />
      ) : (
        <CircleX aria-hidden className="size-3.5" />
      )}
      {SCAN_STATUS_LABEL[status]}
    </span>
  )
}
