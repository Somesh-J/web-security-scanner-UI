import * as Menu from '@radix-ui/react-dropdown-menu'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { IconChevron, IconDownload } from '@/components/ui/Icons'
import { SEV_FILL } from '@/components/ui/severityStyles'
import { cn } from '@/lib/cn'
import { focusOnMount } from '@/lib/focus'
import { categoryName, SEVERITY_TAG, STATUS_LABEL } from '@/lib/labels'
import { usePrefsStore } from '@/stores/prefs'
import { FINDING_STATUSES, OWASP_CATEGORIES, SEVERITIES, type Target } from '@/types/domain'
import type { FacetCounts } from './applyQuery'
import {
  EMPTY_QUERY,
  hasFilters,
  parsePrompt,
  serializePrompt,
  toSearchParams,
  type FindingsQuery,
} from './query'
import { toggle } from './useFindingsQuery'

interface FilterBarProps {
  query: FindingsQuery
  counts: FacetCounts
  targets: Target[]
  onChange: (patch: Partial<FindingsQuery>, options?: { replace?: boolean }) => void
  onApplyView: (search: string) => void
  onExport: () => void
  exportCount: number
}

function Chip({
  pressed,
  onClick,
  children,
  count,
  label,
}: {
  pressed: boolean
  onClick: () => void
  children: ReactNode
  count: number
  label: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${label}, ${count} findings`}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-xs border px-2 font-mono text-[11.5px] transition-colors',
        pressed
          ? 'border-bone bg-panel-2 text-bone'
          : 'border-wire text-ash hover:border-wire-2 hover:text-bone',
        count === 0 && !pressed && 'opacity-50',
      )}
    >
      {children}
      <span className="tabular text-smoke">{count}</span>
    </button>
  )
}

/** Search input with a 200 ms debounce. Typing replaces the history entry instead of pushing one per key. */
function SearchBox({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  const [text, setText] = useState(value)
  const last = useRef(value)
  useEffect(() => {
    if (value !== last.current) {
      setText(value)
      last.current = value
    }
  }, [value])
  useEffect(() => {
    if (text === last.current) return
    const id = window.setTimeout(() => {
      last.current = text
      onChange(text)
    }, 200)
    return () => window.clearTimeout(id)
  }, [text, onChange])

  return (
    <div className="relative w-full sm:w-64">
      <label htmlFor="findings-search" className="sr-only">
        Search findings
      </label>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 font-mono text-[12px] text-smoke"
      >
        &gt;
      </span>
      <input
        id="findings-search"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="search title, CWE, target, path"
        className="h-8 w-full rounded-xs border border-wire bg-panel-2 pr-2 pl-6 font-mono text-[12.5px] text-bone placeholder:text-smoke focus:border-live focus:outline-none focus-visible:outline-none"
      />
    </div>
  )
}

const menuItem =
  'flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 font-mono text-[12px] text-bone outline-none data-[highlighted]:bg-panel-2'

function MultiMenu({ label, selected, children }: { label: string; selected: number; children: ReactNode }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-xs border px-2 font-mono text-[11.5px]',
          selected ? 'border-bone text-bone' : 'border-wire text-ash hover:border-wire-2 hover:text-bone',
        )}
      >
        {label}
        {selected > 0 && (
          <span className="rounded-xs bg-signal px-1 text-[10px] font-semibold text-signal-ink">
            {selected}
          </span>
        )}
        <IconChevron className="rotate-90" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={4}
          className="z-50 max-h-[60dvh] min-w-64 animate-fade overflow-y-auto rounded-sm border border-wire-2 bg-panel p-1 shadow-pop"
        >
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

export function FilterBar({
  query,
  counts,
  targets,
  onChange,
  onApplyView,
  onExport,
  exportCount,
}: FilterBarProps) {
  const views = usePrefsStore((s) => s.savedViews)
  const saveView = usePrefsStore((s) => s.saveView)
  const deleteView = usePrefsStore((s) => s.deleteView)
  const [naming, setNaming] = useState(false)
  const [viewName, setViewName] = useState('')
  const filtersOn = hasFilters(query)
  const currentPrompt = serializePrompt({ ...query, page: 1 })

  return (
    <div className="flex flex-col gap-3 border-b border-wire px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={query.text} onChange={(text) => onChange({ text }, { replace: true })} />

        <div role="group" aria-label="Filter by severity" className="flex flex-wrap items-center gap-1">
          {SEVERITIES.map((s) => (
            <Chip
              key={s}
              label={`${s} severity`}
              pressed={query.severity.includes(s)}
              count={counts.severity[s]}
              onClick={() => onChange({ severity: toggle(query.severity, s) })}
            >
              <span aria-hidden className={cn('size-1.5 rounded-full', SEV_FILL[s])} />
              {SEVERITY_TAG[s]}
            </Chip>
          ))}
        </div>

        <MultiMenu label="Status" selected={query.status.length}>
          {FINDING_STATUSES.map((s) => (
            <Menu.CheckboxItem
              key={s}
              checked={query.status.includes(s)}
              onCheckedChange={() => onChange({ status: toggle(query.status, s) })}
              onSelect={(e) => e.preventDefault()}
              className={menuItem}
            >
              <span aria-hidden className="w-3 text-live">
                {query.status.includes(s) ? '✓' : ''}
              </span>
              <span className="flex-1">{STATUS_LABEL[s]}</span>
              <span className="tabular text-smoke">{counts.status[s]}</span>
            </Menu.CheckboxItem>
          ))}
        </MultiMenu>

        <MultiMenu label="Category" selected={query.category.length}>
          {OWASP_CATEGORIES.map((c) => {
            const code = c.slice(0, 3)
            return (
              <Menu.CheckboxItem
                key={c}
                checked={query.category.includes(code)}
                onCheckedChange={() => onChange({ category: toggle(query.category, code) })}
                onSelect={(e) => e.preventDefault()}
                className={menuItem}
              >
                <span aria-hidden className="w-3 text-live">
                  {query.category.includes(code) ? '✓' : ''}
                </span>
                <span className="text-ash">{code}</span>
                <span className="flex-1 truncate">{categoryName(c)}</span>
                <span className="tabular text-smoke">{counts.category[code] ?? 0}</span>
              </Menu.CheckboxItem>
            )
          })}
        </MultiMenu>

        <MultiMenu label="Target" selected={query.target.length}>
          {targets.map((t) => (
            <Menu.CheckboxItem
              key={t.id}
              checked={query.target.includes(t.id)}
              onCheckedChange={() => onChange({ target: toggle(query.target, t.id) })}
              onSelect={(e) => e.preventDefault()}
              className={menuItem}
            >
              <span aria-hidden className="w-3 text-live">
                {query.target.includes(t.id) ? '✓' : ''}
              </span>
              <span className="flex-1 truncate">{t.name}</span>
              <span className="text-smoke">{t.id}</span>
            </Menu.CheckboxItem>
          ))}
        </MultiMenu>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Menu.Root>
            <Menu.Trigger className="inline-flex h-7 items-center gap-1.5 rounded-xs border border-wire px-2 font-mono text-[11.5px] text-ash hover:border-wire-2 hover:text-bone">
              Saved views
              <IconChevron className="rotate-90" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Content
                align="end"
                sideOffset={4}
                className="z-50 w-72 animate-fade rounded-sm border border-wire-2 bg-panel p-1 shadow-pop"
              >
                {views.map((v) => (
                  <div key={v.id} className="group flex items-center">
                    <Menu.Item
                      className={cn(menuItem, 'flex-1 flex-col items-start gap-0.5')}
                      onSelect={() =>
                        onApplyView(
                          toSearchParams({ ...EMPTY_QUERY, ...parsePrompt(v.query).query }).toString(),
                        )
                      }
                    >
                      <span>{v.name}</span>
                      <span className="text-[11px] text-smoke">{v.query}</span>
                    </Menu.Item>
                    <Menu.Item
                      className="cursor-pointer rounded-xs px-2 py-1 font-mono text-[11px] text-smoke outline-none data-[highlighted]:bg-panel-2 data-[highlighted]:text-signal"
                      onSelect={() => deleteView(v.id)}
                      aria-label={`Delete saved view ${v.name}`}
                    >
                      ✕
                    </Menu.Item>
                  </div>
                ))}
                {views.length === 0 && (
                  <p className="px-2 py-2 font-mono text-[12px] text-smoke">No saved views yet.</p>
                )}
                <Menu.Separator className="my-1 h-px bg-wire" />
                <Menu.Item
                  disabled={!filtersOn}
                  className={cn(
                    menuItem,
                    'text-live data-[disabled]:cursor-not-allowed data-[disabled]:text-smoke',
                  )}
                  onSelect={() => setNaming(true)}
                >
                  + Save current filters as a view
                </Menu.Item>
              </Menu.Content>
            </Menu.Portal>
          </Menu.Root>
          <Button size="sm" icon={<IconDownload />} onClick={onExport} disabled={exportCount === 0}>
            CSV
          </Button>
        </div>
      </div>

      {naming && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!viewName.trim()) return
            saveView(viewName.trim(), currentPrompt)
            setViewName('')
            setNaming(false)
          }}
        >
          <label htmlFor="view-name" className="label">
            View name
          </label>
          <input
            id="view-name"
            ref={focusOnMount}
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setNaming(false)}
            placeholder="e.g. Billing API criticals"
            className="h-7 w-56 rounded-xs border border-wire bg-panel-2 px-2 font-mono text-[12px] text-bone focus:border-live focus:outline-none"
          />
          <span className="font-mono text-[11.5px] text-smoke">{currentPrompt}</span>
          <Button size="sm" type="submit" variant="primary" disabled={!viewName.trim()}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNaming(false)}>
            Cancel
          </Button>
        </form>
      )}

      {filtersOn && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px]">
          <span className="text-smoke">query:</span>
          <code className="text-live">
            {serializePrompt({ ...query, page: 1, sort: EMPTY_QUERY.sort, pageSize: EMPTY_QUERY.pageSize }) ||
              '—'}
          </code>
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_QUERY, sort: query.sort, pageSize: query.pageSize })}
            className="text-ash underline-offset-4 hover:text-signal hover:underline"
          >
            clear filters
          </button>
        </div>
      )}
    </div>
  )
}
