import * as Menu from '@radix-ui/react-dropdown-menu'
import { Bookmark, Check, ChevronDown, Download, Search, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SEVERITY_ICON, SEV_TEXT } from '@/components/ui/severityStyles'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { focusOnMount } from '@/lib/focus'
import { categoryName, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/labels'
import { usePrefsStore } from '@/stores/prefs'
import {
  FINDING_STATUSES,
  OWASP_CATEGORIES,
  SEVERITIES,
  type FindingStatus,
  type Target,
} from '@/types/domain'
import type { FacetCounts } from './applyQuery'
import { EMPTY_QUERY, hasFilters, toSearchParams, type FindingsQuery } from './query'
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

/* ---------- Quick views (status tabs) ---------- */

interface QuickView {
  id: string
  label: string
  statuses: FindingStatus[]
}

const QUICK_VIEWS: QuickView[] = [
  { id: 'all', label: 'All', statuses: [] },
  { id: 'attention', label: 'Needs attention', statuses: ['open', 'confirmed'] },
  { id: 'fixed', label: 'Fixed', statuses: ['resolved'] },
  { id: 'dismissed', label: 'Not an issue', statuses: ['false_positive'] },
]

function sameSet(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((v) => b.includes(v))
}

/** Tabs that set the status filter in one click. Counts honour every other active filter. */
export function QuickViews({
  query,
  counts,
  onChange,
}: Pick<FilterBarProps, 'query' | 'counts' | 'onChange'>) {
  return (
    <div
      role="group"
      aria-label="Quick views"
      className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-2"
    >
      {QUICK_VIEWS.map((v) => {
        const active = sameSet(query.status, v.statuses)
        const statuses: readonly FindingStatus[] = v.statuses.length ? v.statuses : FINDING_STATUSES
        const count = statuses.reduce((n, s) => n + counts.status[s], 0)
        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ status: v.statuses })}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 pt-1.5 pb-2.5 text-[14px] font-medium whitespace-nowrap transition-colors',
              active
                ? 'border-brand text-brand-text'
                : 'border-transparent text-ink-2 hover:border-line-strong hover:text-ink',
            )}
          >
            {v.label}
            <span
              className={cn(
                'tabular rounded-full px-2 py-px text-[12px]',
                active ? 'bg-brand-soft text-brand-text' : 'bg-surface-2 text-ink-2',
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Search ---------- */

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
    <div className="relative w-full lg:w-80">
      <label htmlFor="findings-search" className="sr-only">
        Search issues
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
      />
      <input
        id="findings-search"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search issues, pages or CWE…"
        className="h-9 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[14px] text-ink shadow-sm placeholder:text-ink-3 focus:border-brand focus:ring-3 focus:ring-brand/20 focus:outline-none focus-visible:outline-none"
      />
    </div>
  )
}

/* ---------- Filter dropdowns ---------- */

const menuItem =
  'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] text-ink outline-none data-[highlighted]:bg-surface-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded border transition-colors',
        checked ? 'border-brand bg-brand text-brand-ink' : 'border-line-strong bg-surface',
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  )
}

function FilterMenu({ label, selected, children }: { label: string; selected: number; children: ReactNode }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[14px] font-medium shadow-sm transition-colors data-[state=open]:bg-surface-2',
          selected
            ? 'border-brand/40 bg-brand-soft text-brand-text'
            : 'border-line-strong bg-surface text-ink hover:bg-surface-2',
        )}
      >
        {label}
        {selected > 0 && (
          <span className="tabular rounded-full bg-brand px-1.5 text-[11.5px] leading-[18px] text-brand-ink">
            {selected}
          </span>
        )}
        <ChevronDown aria-hidden className="size-4 opacity-70" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 max-h-[60dvh] min-w-64 animate-fade overflow-y-auto rounded-lg border border-line bg-surface p-1.5 shadow-lg"
        >
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

function Option({
  checked,
  onToggle,
  count,
  children,
}: {
  checked: boolean
  onToggle: () => void
  count?: number
  children: ReactNode
}) {
  return (
    <Menu.CheckboxItem
      checked={checked}
      onCheckedChange={onToggle}
      onSelect={(e) => e.preventDefault()}
      className={cn(menuItem, count === 0 && !checked && 'text-ink-3')}
    >
      <CheckBox checked={checked} />
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      {count !== undefined && <span className="tabular text-[13px] text-ink-3">{count}</span>}
    </Menu.CheckboxItem>
  )
}

/* ---------- Active filter pills ---------- */

function Pill({ children, onRemove, label }: { children: ReactNode; onRemove: () => void; label: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface-2 pr-1 pl-3 text-[13px] text-ink">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="grid size-5 place-items-center rounded-full text-ink-3 hover:bg-line hover:text-ink"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </span>
  )
}

/* ---------- The bar ---------- */

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
  const currentSearch = toSearchParams({ ...query, page: 1 }).toString()
  const targetName = (id: string) => targets.find((t) => t.id === id)?.name ?? id

  const pills: { key: string; label: string; node: ReactNode; remove: () => void }[] = [
    ...(query.text
      ? [
          {
            key: 'text',
            label: `Search “${query.text}”`,
            node: <>Search: “{query.text}”</>,
            remove: () => onChange({ text: '' }),
          },
        ]
      : []),
    ...query.severity.map((s) => {
      const Icon = SEVERITY_ICON[s]
      return {
        key: `sev-${s}`,
        label: SEVERITY_LABEL[s],
        node: (
          <>
            <Icon aria-hidden className={cn('size-3.5', SEV_TEXT[s])} />
            {SEVERITY_LABEL[s]}
          </>
        ),
        remove: () => onChange({ severity: toggle(query.severity, s) }),
      }
    }),
    ...query.status.map((s) => ({
      key: `status-${s}`,
      label: STATUS_LABEL[s],
      node: <>{STATUS_LABEL[s]}</>,
      remove: () => onChange({ status: toggle(query.status, s) }),
    })),
    ...query.category.map((c) => {
      const full = OWASP_CATEGORIES.find((o) => o.startsWith(c))
      const name = full ? categoryName(full) : c
      return {
        key: `cat-${c}`,
        label: name,
        node: <>{name}</>,
        remove: () => onChange({ category: toggle(query.category, c) }),
      }
    }),
    ...query.cwe.map((c) => ({
      key: `cwe-${c}`,
      label: c,
      node: <span className="font-mono text-[12.5px]">{c}</span>,
      remove: () => onChange({ cwe: toggle(query.cwe, c) }),
    })),
    ...query.target.map((t) => ({
      key: `target-${t}`,
      label: targetName(t),
      node: <>{targetName(t)}</>,
      remove: () => onChange({ target: toggle(query.target, t) }),
    })),
    ...query.scan.map((s) => ({
      key: `scan-${s}`,
      label: `Scan ${s}`,
      node: <>Scan {s.replace('scan_', '#')}</>,
      remove: () => onChange({ scan: toggle(query.scan, s) }),
    })),
  ]

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={query.text} onChange={(text) => onChange({ text }, { replace: true })} />

        <FilterMenu label="Severity" selected={query.severity.length}>
          {SEVERITIES.map((s) => {
            const Icon = SEVERITY_ICON[s]
            return (
              <Option
                key={s}
                checked={query.severity.includes(s)}
                count={counts.severity[s]}
                onToggle={() => onChange({ severity: toggle(query.severity, s) })}
              >
                <Icon aria-hidden className={cn('size-4 shrink-0', SEV_TEXT[s])} />
                {SEVERITY_LABEL[s]}
              </Option>
            )
          })}
        </FilterMenu>

        <FilterMenu label="Category" selected={query.category.length}>
          {OWASP_CATEGORIES.map((c) => {
            const code = c.slice(0, 3)
            return (
              <Option
                key={c}
                checked={query.category.includes(code)}
                count={counts.category[code] ?? 0}
                onToggle={() => onChange({ category: toggle(query.category, code) })}
              >
                <span className="truncate">{categoryName(c)}</span>
                <span className="font-mono text-[12px] text-ink-3">{code}</span>
              </Option>
            )
          })}
        </FilterMenu>

        <FilterMenu label="Status" selected={query.status.length}>
          {FINDING_STATUSES.map((s) => (
            <Option
              key={s}
              checked={query.status.includes(s)}
              count={counts.status[s]}
              onToggle={() => onChange({ status: toggle(query.status, s) })}
            >
              {STATUS_LABEL[s]}
            </Option>
          ))}
        </FilterMenu>

        <FilterMenu label="Website" selected={query.target.length}>
          {targets.length === 0 && <p className="px-2.5 py-2 text-[13px] text-ink-3">No websites yet.</p>}
          {targets.map((t) => (
            <Option
              key={t.id}
              checked={query.target.includes(t.id)}
              onToggle={() => onChange({ target: toggle(query.target, t.id) })}
            >
              <span className="truncate">{t.name}</span>
            </Option>
          ))}
        </FilterMenu>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Menu.Root>
            <Menu.Trigger className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[14px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink data-[state=open]:bg-surface-2">
              <Bookmark aria-hidden className="size-4" />
              Saved views
              <ChevronDown aria-hidden className="size-4 opacity-70" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Content
                align="end"
                sideOffset={6}
                className="z-50 w-72 animate-fade rounded-lg border border-line bg-surface p-1.5 shadow-lg"
              >
                {views.map((v) => (
                  <div key={v.id} className="flex items-center gap-1">
                    <Menu.Item className={cn(menuItem, 'flex-1')} onSelect={() => onApplyView(v.search)}>
                      <Bookmark aria-hidden className="size-4 text-ink-3" />
                      <span className="truncate">{v.name}</span>
                    </Menu.Item>
                    <Menu.Item
                      className="grid size-8 cursor-pointer place-items-center rounded-md text-ink-3 outline-none data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger"
                      onSelect={() => deleteView(v.id)}
                      aria-label={`Delete saved view ${v.name}`}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Menu.Item>
                  </div>
                ))}
                {views.length === 0 && (
                  <p className="px-2.5 py-2 text-[13px] text-ink-3">
                    Save the filters you use often to get back to them in one click.
                  </p>
                )}
                <Menu.Separator className="my-1 h-px bg-line" />
                <Menu.Item
                  disabled={!filtersOn}
                  className={cn(menuItem, 'font-medium text-brand-text')}
                  onSelect={() => setNaming(true)}
                >
                  Save current filters…
                </Menu.Item>
              </Menu.Content>
            </Menu.Portal>
          </Menu.Root>
          <Button icon={<Download aria-hidden />} onClick={onExport} disabled={exportCount === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      {naming && (
        <form
          className="flex flex-wrap items-center gap-2 rounded-md bg-surface-2 p-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!viewName.trim()) return
            saveView(viewName.trim(), currentSearch)
            setViewName('')
            setNaming(false)
          }}
        >
          <label htmlFor="view-name" className="text-[13px] font-medium text-ink">
            Name this view
          </label>
          <input
            id="view-name"
            ref={focusOnMount}
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setNaming(false)}
            placeholder="e.g. Critical issues on Acme Store"
            className="h-8 w-64 rounded-md border border-line-strong bg-surface px-3 text-[14px] text-ink focus:border-brand focus:outline-none"
          />
          <Button size="sm" type="submit" variant="primary" disabled={!viewName.trim()}>
            Save view
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNaming(false)}>
            Cancel
          </Button>
        </form>
      )}

      {pills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink-3">Filtered by</span>
          {pills.map((p) => (
            <Pill key={p.key} label={p.label} onRemove={p.remove}>
              {p.node}
            </Pill>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_QUERY, sort: query.sort, pageSize: query.pageSize })}
            className="ml-1 text-[13px] font-medium text-brand-text hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
