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
  const btn = 'inline-flex h-7 min-w-7 items-center justify-center rounded-xs px-1.5 font-mono text-[12px]'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-wire px-4 py-2.5 font-mono text-[12px] text-ash">
      <p>
        showing <span className="tabular text-bone">{from}</span>–
        <span className="tabular text-bone">{to}</span> of <span className="tabular text-bone">{total}</span>{' '}
        {noun}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Pagination" className="flex items-center gap-0.5">
          <button
            type="button"
            className={cn(btn, 'text-ash hover:text-bone disabled:opacity-40')}
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            ‹
          </button>
          {pageWindow(page, pageCount).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden className="px-1 text-smoke">
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
                  p === page ? 'bg-bone text-void' : 'text-ash hover:bg-panel-2 hover:text-bone',
                )}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className={cn(btn, 'text-ash hover:text-bone disabled:opacity-40')}
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
          >
            ›
          </button>
        </nav>
        <label className="flex items-center gap-2">
          rows
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-7 cursor-pointer rounded-xs border border-wire bg-panel-2 px-1.5 text-bone focus:border-live focus:outline-none"
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
