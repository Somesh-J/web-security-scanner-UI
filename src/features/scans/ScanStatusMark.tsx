import { cn } from '@/lib/cn'
import { SCAN_STATUS_LABEL } from '@/lib/labels'
import type { ScanStatus } from '@/types/domain'

const GLYPH: Record<ScanStatus, string> = { queued: '○', running: '●', completed: '✓', failed: '✕' }
const TONE: Record<ScanStatus, string> = {
  queued: 'text-ash',
  running: 'text-live',
  completed: 'text-clear',
  failed: 'text-signal',
}

/** Scan state as glyph + word. Running pulses: the only continuously animated element besides progress. */
export function ScanStatusMark({ status }: { status: ScanStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-[11.5px] font-semibold tracking-wider',
        TONE[status],
      )}
    >
      {status === 'running' ? (
        <span aria-hidden className="size-2 animate-pulse-live rounded-full bg-live" />
      ) : (
        <span aria-hidden className="w-2 text-center">
          {GLYPH[status]}
        </span>
      )}
      {SCAN_STATUS_LABEL[status]}
    </span>
  )
}
