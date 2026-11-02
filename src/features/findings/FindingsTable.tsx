import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { memo, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { SeverityBadge, StatusBadge } from '@/components/ui/Badges'
import { cn } from '@/lib/cn'
import { formatRelative, formatUtc } from '@/lib/format'
import { categoryCode, categoryName } from '@/lib/labels'
import type { Finding } from '@/types/domain'
import type { SortKey, SortSpec } from './query'

interface Column {
  key: SortKey
  label: string
  className?: string
}

const COLUMNS: Column[] = [
  { key: 'severity', label: 'Severity', className: 'w-[124px]' },
  { key: 'title', label: 'Issue' },
  { key: 'category', label: 'Category', className: 'w-[200px]' },
  { key: 'target', label: 'Website', className: 'w-[150px]' },
  { key: 'status', label: 'Status', className: 'w-[148px]' },
  { key: 'date', label: 'Found', className: 'w-[104px]' },
]

interface FindingsTableProps {
  rows: Finding[]
  sort: SortSpec[]
  targetNames: ReadonlyMap<string, string>
  selected: ReadonlySet<string>
  activeId: string | null
  /** Search string carried into the detail link so "back" returns to the same view. */
  search: string
  onSort: (key: SortKey, additive: boolean) => void
  onToggle: (id: string) => void
  onToggleAll: (checked: boolean) => void
  onOpen: (id: string) => void
  onActivate: (id: string) => void
}

function ariaSort(key: SortKey, sort: SortSpec[]): 'ascending' | 'descending' | 'none' {
  const spec = sort.find((s) => s.key === key)
  if (!spec) return 'none'
  return spec.dir === 'asc' ? 'ascending' : 'descending'
}

const checkbox = 'size-4 cursor-pointer rounded accent-[var(--brand)]'

/**
 * The issues table. Memoised: it only re-renders when its rows, sort or selection change,
 * not when unrelated state (search typing, toasts) updates.
 * CWE (a brief column) sits under the category as meta, with its own sort button in that header,
 * so beginners see the friendly name first and every brief column stays sortable.
 */
export const FindingsTable = memo(function FindingsTable({
  rows,
  sort,
  targetNames,
  selected,
  activeId,
  search,
  onSort,
  onToggle,
  onToggleAll,
  onOpen,
  onActivate,
}: FindingsTableProps) {
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someOnPage = rows.some((r) => selected.has(r.id))

  function header(col: Column) {
    const state = ariaSort(col.key, sort)
    const index = sort.findIndex((s) => s.key === col.key)
    const Arrow = state === 'ascending' ? ArrowUp : state === 'descending' ? ArrowDown : ChevronsUpDown
    return (
      <button
        type="button"
        onClick={(e: MouseEvent) => onSort(col.key, e.shiftKey)}
        className={cn(
          'group/sort -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12.5px] font-medium hover:bg-surface-2 hover:text-ink',
          state !== 'none' ? 'text-ink' : 'text-ink-3',
        )}
      >
        {col.label}
        <Arrow
          aria-hidden
          className={cn(
            'size-3.5',
            state === 'none' ? 'opacity-0 group-hover/sort:opacity-60' : 'text-brand-text',
          )}
        />
        {sort.length > 1 && index >= 0 && (
          <span aria-hidden className="text-[10px] text-ink-3">
            {index + 1}
          </span>
        )}
      </button>
    )
  }

  const cweState = ariaSort('cwe', sort)

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[920px] table-fixed border-collapse text-left">
        <caption className="sr-only">
          Issues. Select a column header to sort; hold Shift to add a second sort. Select a row to open it.
        </caption>
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-y border-line bg-surface-2/60">
            <th scope="col" className="w-12 py-2.5 pr-2 pl-5">
              <input
                type="checkbox"
                aria-label={allOnPage ? 'Deselect all on this page' : 'Select all on this page'}
                checked={allOnPage}
                ref={(el) => {
                  if (el) el.indeterminate = someOnPage && !allOnPage
                }}
                onChange={(e) => onToggleAll(e.target.checked)}
                className={checkbox}
              />
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={ariaSort(col.key, sort)}
                className={cn('px-3 py-2.5', col.className)}
              >
                {col.key === 'category' ? (
                  <span className="inline-flex items-center gap-3">
                    {header(col)}
                    <button
                      type="button"
                      onClick={(e: MouseEvent) => onSort('cwe', e.shiftKey)}
                      aria-label={`Sort by CWE${cweState === 'none' ? '' : `, currently ${cweState}`}`}
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[12px] font-medium hover:bg-surface-2 hover:text-ink',
                        cweState !== 'none' ? 'text-brand-text' : 'text-ink-3',
                      )}
                    >
                      CWE
                      {cweState === 'ascending' ? ' ↑' : cweState === 'descending' ? ' ↓' : ''}
                    </button>
                  </span>
                ) : (
                  header(col)
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => {
            const isSelected = selected.has(f.id)
            const isActive = activeId === f.id
            return (
              <tr
                key={f.id}
                data-finding-id={f.id}
                onClick={() => onOpen(f.id)}
                onMouseEnter={() => onActivate(f.id)}
                aria-selected={isSelected}
                className={cn(
                  'group h-[60px] cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-surface-2/70',
                  isSelected && 'bg-brand-soft/60 hover:bg-brand-soft',
                  isActive && 'shadow-[inset_3px_0_0_var(--brand)]',
                )}
              >
                <td className="py-3 pr-2 pl-5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${f.title}`}
                    checked={isSelected}
                    onChange={() => onToggle(f.id)}
                    className={checkbox}
                  />
                </td>
                <td className="px-3 py-3">
                  <SeverityBadge severity={f.severity} />
                </td>
                <td className="min-w-0 px-3 py-3">
                  <Link
                    to={{ pathname: `/findings/${f.id}`, search }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onOpen(f.id)
                    }}
                    className="block truncate text-[14px] font-medium text-ink group-hover:text-brand-text"
                  >
                    {f.title}
                  </Link>
                  <span className="mt-0.5 block truncate font-mono text-[12px] text-ink-3">{f.location}</span>
                </td>
                <td className="min-w-0 px-3 py-3" title={f.category}>
                  <span className="block truncate text-[14px] text-ink">{categoryName(f.category)}</span>
                  <span className="mt-0.5 block font-mono text-[12px] text-ink-3">
                    {categoryCode(f.category)} · {f.cwe}
                  </span>
                </td>
                <td className="truncate px-3 py-3 text-[14px] text-ink-2">
                  {targetNames.get(f.targetId) ?? f.targetId}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={f.status} />
                </td>
                <td className="tabular px-3 py-3 text-[13px] text-ink-2" title={formatUtc(f.discoveredAt)}>
                  {formatRelative(f.discoveredAt)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

/** Card list for narrow screens: same data, stacked. */
export const FindingsCards = memo(function FindingsCards({
  rows,
  targetNames,
  selected,
  onToggle,
  onOpen,
}: Pick<FindingsTableProps, 'rows' | 'targetNames' | 'selected' | 'onToggle' | 'onOpen'>) {
  return (
    <ul className="divide-y divide-line border-t border-line md:hidden">
      {rows.map((f) => (
        <li key={f.id} className={cn('flex gap-3 px-4 py-4', selected.has(f.id) && 'bg-brand-soft/60')}>
          <input
            type="checkbox"
            aria-label={`Select ${f.title}`}
            checked={selected.has(f.id)}
            onChange={() => onToggle(f.id)}
            className={cn(checkbox, 'mt-1')}
          />
          <button type="button" onClick={() => onOpen(f.id)} className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={f.severity} />
              <StatusBadge status={f.status} />
            </div>
            <p className="mt-2 text-[15px] font-medium text-ink">{f.title}</p>
            <p className="mt-0.5 truncate font-mono text-[12px] text-ink-3">{f.location}</p>
            <p className="mt-1.5 text-[13px] text-ink-2">
              {categoryName(f.category)} · {targetNames.get(f.targetId) ?? f.targetId} ·{' '}
              {formatRelative(f.discoveredAt)}
            </p>
          </button>
        </li>
      ))}
    </ul>
  )
})
