import { cn } from '@/lib/cn'
import { asciiBar } from '@/lib/format'

interface ProgressRailProps {
  progress: number
  label: string
  live?: boolean
  className?: string
}

/**
 * Scan progress: a real progressbar for assistive tech, a bar that eases between server ticks,
 * a light sweep while live, and a fixed-width ASCII readout so nothing jitters as numbers change.
 */
export function ProgressRail({ progress, label, live = true, className }: ProgressRailProps) {
  const value = Math.round(progress)
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="relative h-1 min-w-16 flex-1 overflow-hidden rounded-full bg-wire"
      >
        <div
          className="relative h-full overflow-hidden rounded-full bg-live transition-[width] duration-[1800ms] ease-linear"
          style={{ width: `${value}%` }}
        >
          {live && (
            <span
              aria-hidden
              className="absolute inset-0 animate-sweep bg-gradient-to-r from-transparent via-white/60 to-transparent"
            />
          )}
        </div>
      </div>
      <span aria-hidden className="hidden font-mono text-[12px] whitespace-pre text-ash lg:inline">
        {asciiBar(value)}
      </span>
      <span aria-hidden className="tabular w-9 text-right font-mono text-[12px] text-bone">
        {value}%
      </span>
    </div>
  )
}
