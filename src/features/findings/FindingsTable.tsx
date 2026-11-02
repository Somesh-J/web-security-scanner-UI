import { memo, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { SeverityTag, StatusMark } from '@/components/ui/Tags'
import { cn } from '@/lib/cn'
import { categoryCode, categoryName } from '@/lib/labels'
import { formatUtcShort } from '@/lib/format'
import type { Finding } from '@/types/domain'
import type { SortKey, SortSpec } from './query'

interface Column {
  key: SortKey
  label: string
  className?: string
}

const COLUMNS: Column[] = [
  { key: 'severity', label: 'Severity', className: 'w-[92px]' },
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category', className: 'w-[170px]' },
  { key: 'cwe', label: 'CWE', className: 'w-[92px]' },
  { key: 'target', label: 'Target', className: 'w-[130px]' },
  { key: 'status', label: 'Status', className: 'w-[132px]' },
  { key: 'date', label: 'Found (UTC)', className: 'w-[108px]' },
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

/**
 * The findings grid. Memoised: it only re-renders when its rows, sort or selection change,
 * not when unrelated state (prompt text, toasts, clock) updates.
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

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[920px] table-fixed border-collapse text-left">
        <caption className="sr-only">
          Findings. Column headers sort the table; hold Shift to add a secondary sort. Press j and k to move,
          Enter to open.
        </caption>
        <thead>
          <tr className="border-b border-wire">
            <th scope="col" className="w-10 px-3 py-2.5">
              <input
                type="checkbox"
                aria-label={allOnPage ? 'Deselect all on this page' : 'Select all on this page'}
                checked={allOnPage}
                ref={(el) => {
                  if (el) el.indeterminate = someOnPage && !allOnPage
                }}
                onChange={(e) => onToggleAll(e.target.checked)}
                className="size-3.5 cursor-pointer accent-signal"
              />
            </th>
            {COLUMNS.map((col) => {
              const state = ariaSort(col.key, sort)
              const index = sort.findIndex((s) => s.key === col.key)
              return (
                <th key={col.key} scope="col" aria-sort={state} className={cn('px-3 py-2.5', col.className)}>
                  <button
                    type="button"
                    onClick={(e: MouseEvent) => onSort(col.key, e.shiftKey)}
                    className={cn(
                      'label inline-flex items-center gap-1 hover:text-bone',
                      state !== 'none' && 'text-bone',
                    )}
                  >
                    {col.label}
                    <span aria-hidden className="w-3 text-live">
                      {state === 'ascending' ? '↑' : state === 'descending' ? '↓' : ''}
                    </span>
                    {sort.length > 1 && index >= 0 && (
                      <span aria-hidden className="text-[9px] text-smoke">
                        {index + 1}
                      </span>
                    )}
                  </button>
                </th>
              )
            })}
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
                  'group cursor-pointer border-b border-wire transition-colors hover:bg-panel-2',
                  isSelected && 'bg-signal/[0.06]',
                  isActive && 'bg-panel-2 shadow-[inset_2px_0_0_var(--live)]',
                )}
              >
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${f.title}`}
                    checked={isSelected}
                    onChange={() => onToggle(f.id)}
                    className="size-3.5 cursor-pointer accent-signal"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <SeverityTag severity={f.severity} />
                </td>
                <td className="min-w-0 px-3 py-2.5">
                  <Link
                    to={{ pathname: `/findings/${f.id}`, search }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onOpen(f.id)
                    }}
                    className="block truncate text-[13.5px] font-medium text-bone group-hover:underline group-hover:decoration-wire-2 group-hover:underline-offset-4"
                  >
                    {f.title}
                  </Link>
                  <span className="mt-0.5 block truncate font-mono text-[11.5px] text-smoke">
                    {f.id} · {f.location}
                  </span>
                </td>
                <td className="truncate px-3 py-2.5 text-[12.5px] text-ash" title={f.category}>
                  <span className="font-mono text-bone">{categoryCode(f.category)}</span>{' '}
                  {categoryName(f.category)}
                </td>
                <td className="px-3 py-2.5 font-mono text-[12.5px] text-bone">{f.cwe}</td>
                <td className="truncate px-3 py-2.5 text-[12.5px] text-ash">
                  {targetNames.get(f.targetId) ?? f.targetId}
                </td>
                <td className="px-3 py-2.5">
                  <StatusMark status={f.status} />
                </td>
                <td className="tabular px-3 py-2.5 font-mono text-[12px] text-ash">
                  {formatUtcShort(f.discoveredAt)}
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
    <ul className="divide-y divide-wire md:hidden">
      {rows.map((f) => (
        <li key={f.id} className="flex gap-3 px-4 py-3">
          <input
            type="checkbox"
            aria-label={`Select ${f.title}`}
            checked={selected.has(f.id)}
            onChange={() => onToggle(f.id)}
            className="mt-1 size-4 accent-signal"
          />
          <button type="button" onClick={() => onOpen(f.id)} className="min-w-0 flex-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <SeverityTag severity={f.severity} />
              <StatusMark status={f.status} />
            </div>
            <p className="mt-1.5 text-[14px] font-medium text-bone">{f.title}</p>
            <p className="mt-1 truncate font-mono text-[11.5px] text-smoke">{f.location}</p>
            <p className="mt-1 font-mono text-[11.5px] text-ash">
              {f.cwe} · {categoryCode(f.category)} · {targetNames.get(f.targetId) ?? f.targetId} ·{' '}
              {formatUtcShort(f.discoveredAt)}
            </p>
          </button>
        </li>
      ))}
    </ul>
  )
})
