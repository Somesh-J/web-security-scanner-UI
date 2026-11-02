import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageWindow } from '@/lib/pagination'

interface PaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  pageSizes: readonly number[]
  onPage: (page: number) => void
  onPageSize: (size: number) => void
  noun?: string
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  pageSizes,
  onPage,
  onPageSize,
  noun = 'rows',
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-medium transition-colors'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13px] text-ink-2">
      <p>
        Showing <span className="tabular font-medium text-ink">{from}</span>–
        <span className="tabular font-medium text-ink">{to}</span> of{' '}
        <span className="tabular font-medium text-ink">{total}</span> {noun}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            className={cn(btn, 'text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-40')}
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          {pageWindow(page, pageCount).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden className="px-1 text-ink-3">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  btn,
                  'tabular',
                  p === page
                    ? 'bg-brand-soft text-brand-text'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className={cn(btn, 'text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-40')}
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </nav>
        <label className="flex items-center gap-2">
          Per page
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-8 cursor-pointer rounded-md border border-line-strong bg-surface px-2 text-ink focus:border-brand focus:outline-none"
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
