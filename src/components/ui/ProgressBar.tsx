import { cn } from '@/lib/cn'

interface ProgressBarProps {
  progress: number
  label: string
  /** Show the percentage next to the bar. */
  showValue?: boolean
  className?: string
}

/**
 * Scan progress: a real progressbar for assistive tech, with a bar that eases between server ticks
 * so the timer-driven updates read as smooth motion rather than jumps.
 */
export function ProgressBar({ progress, label, showValue = true, className }: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, Math.round(progress)))
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="relative h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-[1800ms] ease-linear"
          style={{ width: `${value}%` }}
        />
      </div>
      {showValue && (
        <span aria-hidden className="tabular w-9 text-right text-[13px] font-medium text-ink">
          {value}%
        </span>
      )}
    </div>
  )
}
