import { Button } from '@/components/ui/Button'
import type { FindingStatus } from '@/types/domain'

interface BulkBarProps {
  count: number
  matchedCount: number
  onSelectAllMatching: () => void
  onClear: () => void
  onSetStatus: (status: FindingStatus) => void
  pending: boolean
}

/** Appears when rows are selected. Applies one status to every selected finding in a single request. */
export function BulkBar({
  count,
  matchedCount,
  onSelectAllMatching,
  onClear,
  onSetStatus,
  pending,
}: BulkBarProps) {
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-signal/40 bg-signal/[0.07] px-4 py-2"
    >
      <p className="font-mono text-[12px] text-bone">
        <span className="tabular font-semibold">{count}</span> selected
        {count < matchedCount && (
          <>
            {' · '}
            <button
              type="button"
              onClick={onSelectAllMatching}
              className="text-live underline-offset-4 hover:underline"
            >
              select all {matchedCount} matching
            </button>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="label mr-1">Mark as</span>
        <Button size="sm" onClick={() => onSetStatus('confirmed')} disabled={pending}>
          Confirmed
        </Button>
        <Button size="sm" onClick={() => onSetStatus('resolved')} disabled={pending}>
          Resolved
        </Button>
        <Button size="sm" onClick={() => onSetStatus('false_positive')} disabled={pending}>
          False positive
        </Button>
        <Button size="sm" onClick={() => onSetStatus('open')} disabled={pending}>
          Reopen
        </Button>
      </div>
      <Button size="sm" variant="ghost" onClick={onClear} className="ml-auto">
        Clear selection
      </Button>
    </div>
  )
}
