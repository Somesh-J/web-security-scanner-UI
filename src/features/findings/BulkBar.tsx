import { CircleCheck, CircleDot, CircleSlash, TriangleAlert, X } from 'lucide-react'
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

/**
 * Floating action bar, shown while rows are selected. Applies one status to every selected issue in a
 * single request (optimistic, rolled back on failure by useSetFindingStatus).
 */
export function BulkBar({
  count,
  matchedCount,
  onSelectAllMatching,
  onClear,
  onSetStatus,
  pending,
}: BulkBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 md:bottom-6">
      <div
        role="region"
        aria-label="Bulk actions"
        className="pointer-events-auto flex max-w-full animate-rise flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-lg"
      >
        <p className="text-[14px] text-ink">
          <span className="tabular font-semibold">{count}</span> selected
          {count < matchedCount && (
            <>
              {' · '}
              <button
                type="button"
                onClick={onSelectAllMatching}
                className="font-medium text-brand-text hover:underline"
              >
                Select all {matchedCount}
              </button>
            </>
          )}
        </p>
        <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => onSetStatus('confirmed')}
            disabled={pending}
            icon={<TriangleAlert aria-hidden />}
          >
            Mark confirmed
          </Button>
          <Button
            size="sm"
            onClick={() => onSetStatus('resolved')}
            disabled={pending}
            icon={<CircleCheck aria-hidden />}
          >
            Mark fixed
          </Button>
          <Button
            size="sm"
            onClick={() => onSetStatus('false_positive')}
            disabled={pending}
            icon={<CircleSlash aria-hidden />}
          >
            Not an issue
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSetStatus('open')}
            disabled={pending}
            icon={<CircleDot aria-hidden />}
          >
            Reopen
          </Button>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="grid size-8 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  )
}
