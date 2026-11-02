import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFindings, useSetFindingStatus, useTargets } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { PageHeader, Panel } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States'
import { findingsToCsv } from '@/lib/csv'
import { downloadBlob } from '@/lib/download'
import { isOpenStatus } from '@/lib/labels'
import { toast } from '@/stores/toast'
import type { FindingStatus } from '@/types/domain'
import { applyQuery, facetCounts } from './applyQuery'
import { BulkBar } from './BulkBar'
import { FilterBar } from './FilterBar'
import { FindingsCards, FindingsTable } from './FindingsTable'
import {
  EMPTY_QUERY,
  hasFilters,
  PAGE_SIZES,
  serializePrompt,
  type FindingsQuery,
  type SortKey,
} from './query'
import { useFindingsQuery } from './useFindingsQuery'

function anyDialogOpen() {
  return Boolean(document.querySelector('[role="dialog"][data-state="open"]'))
}

function isTyping(el: EventTarget | null) {
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
  )
}

export function FindingsPage() {
  const findingsQuery = useFindings()
  const { data: targets = [] } = useTargets()
  const setStatus = useSetFindingStatus()
  const { query, update } = useFindingsQuery()
  const navigate = useNavigate()
  const location = useLocation()
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [activeId, setActiveId] = useState<string | null>(null)

  const findings = useMemo(() => findingsQuery.data ?? [], [findingsQuery.data])
  const targetNames = useMemo(() => new Map(targets.map((t) => [t.id, t.name])), [targets])
  const ctx = useMemo(() => ({ targetNames }), [targetNames])

  // The whole pipeline is memoised on (data, query): typing in unrelated inputs never re-filters.
  const result = useMemo(() => applyQuery(findings, query, ctx), [findings, query, ctx])
  const counts = useMemo(() => facetCounts(findings, query, ctx), [findings, query, ctx])
  const openCount = useMemo(() => findings.filter((f) => isOpenStatus(f.status)).length, [findings])

  const open = useCallback(
    (id: string) =>
      navigate({ pathname: `/findings/${id}`, search: location.search }, { state: { background: location } }),
    [navigate, location],
  )

  const onChange = useCallback(
    (patch: Partial<FindingsQuery>, options?: { replace?: boolean }) => update(patch, options),
    [update],
  )

  const onSort = useCallback(
    (key: SortKey, additive: boolean) => {
      const existing = query.sort.find((s) => s.key === key)
      const defaultDir = key === 'title' || key === 'category' || key === 'target' ? 'asc' : 'desc'
      const nextDir = existing ? (existing.dir === 'asc' ? 'desc' : 'asc') : defaultDir
      const spec = { key, dir: nextDir } as const
      const sort = additive
        ? existing
          ? query.sort.map((s) => (s.key === key ? spec : s))
          : [...query.sort, spec]
        : [spec]
      update({ sort })
    },
    [query.sort, update],
  )

  const onToggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const onToggleAll = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const r of result.rows) {
          if (checked) next.add(r.id)
          else next.delete(r.id)
        }
        return next
      })
    },
    [result.rows],
  )

  function exportCsv() {
    downloadBlob(
      findingsToCsv(result.matched, targetNames),
      `redcell-findings-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv',
    )
    toast.success('CSV exported', `${result.matched.length} findings from the current view`)
  }

  function bulkSet(status: FindingStatus) {
    const ids = [...selected]
    setStatus.mutate(
      { ids, status },
      {
        onSuccess: () => {
          toast.success(
            `${ids.length} finding${ids.length === 1 ? '' : 's'} updated`,
            `Marked as ${status.replace('_', ' ')}`,
          )
          setSelected(new Set())
        },
      },
    )
  }

  // Keyboard triage: j/k move, Enter opens, x selects.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || anyDialogOpen() || e.metaKey || e.ctrlKey || e.altKey) return
      const rows = result.rows
      if (!rows.length) return
      const index = rows.findIndex((r) => r.id === activeId)
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault()
        const next =
          e.key === 'j' ? Math.min(rows.length - 1, index + 1) : Math.max(0, index === -1 ? 0 : index - 1)
        const id = rows[next]?.id ?? null
        setActiveId(id)
        document.querySelector(`[data-finding-id="${id}"]`)?.scrollIntoView({ block: 'nearest' })
      } else if (e.key === 'Enter' && activeId) {
        e.preventDefault()
        open(activeId)
      } else if (e.key === 'x' && activeId) {
        e.preventDefault()
        onToggle(activeId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result.rows, activeId, open, onToggle])

  const filtersOn = hasFilters(query)

  let body
  if (findingsQuery.isPending) {
    body = (
      <SkeletonRows
        label="fetching /api/findings"
        columns={['w-4', 'w-12', 'w-2/5', 'w-28', 'w-14', 'w-24', 'w-20', 'w-20']}
      />
    )
  } else if (findingsQuery.isError) {
    body = (
      <ErrorState
        error={findingsQuery.error}
        resource="/api/findings"
        onRetry={() => void findingsQuery.refetch()}
        retrying={findingsQuery.isFetching}
      />
    )
  } else if (findings.length === 0) {
    body = (
      <EmptyState
        title="0 findings on record"
        detail="Findings appear here when a scan completes. Add a target and launch a scan to start."
        action={
          <Button variant="primary" onClick={() => navigate('/scans')}>
            Go to scans
          </Button>
        }
      />
    )
  } else if (result.total === 0) {
    body = (
      <EmptyState
        title={`0 findings match ${serializePrompt({ ...query, page: 1 }) || 'this view'}`}
        detail="Widen the search or remove a filter."
        action={
          <Button onClick={() => update({ ...EMPTY_QUERY, sort: query.sort, pageSize: query.pageSize })}>
            Clear filters
          </Button>
        }
      />
    )
  } else {
    body = (
      <>
        <FindingsTable
          rows={result.rows}
          sort={query.sort}
          targetNames={targetNames}
          selected={selected}
          activeId={activeId}
          search={location.search}
          onSort={onSort}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
          onOpen={open}
          onActivate={setActiveId}
        />
        <FindingsCards
          rows={result.rows}
          targetNames={targetNames}
          selected={selected}
          onToggle={onToggle}
          onOpen={open}
        />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={query.pageSize}
          pageSizes={PAGE_SIZES}
          noun="findings"
          onPage={(page) => update({ page })}
          onPageSize={(pageSize) => update({ pageSize })}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6 md:px-6">
      <PageHeader
        title="Findings"
        meta={
          findingsQuery.data
            ? `${findings.length} total · ${openCount} need action · ${filtersOn ? `${result.total} in this view` : 'no filters'}`
            : findingsQuery.isError
              ? 'could not load findings'
              : 'loading findings'
        }
      />
      <p className="sr-only" aria-live="polite">
        {findingsQuery.data ? `${result.total} findings match.` : ''}
      </p>
      <Panel label="Findings table">
        <FilterBar
          query={query}
          counts={counts}
          targets={targets}
          onChange={onChange}
          onApplyView={(search) => navigate({ pathname: '/findings', search })}
          onExport={exportCsv}
          exportCount={result.total}
        />
        {selected.size > 0 && (
          <BulkBar
            count={selected.size}
            matchedCount={result.total}
            onSelectAllMatching={() => setSelected(new Set(result.matched.map((f) => f.id)))}
            onClear={() => setSelected(new Set())}
            onSetStatus={bulkSet}
            pending={setStatus.isPending}
          />
        )}
        {body}
      </Panel>
      <p className="hidden font-mono text-[11.5px] text-smoke md:block">
        j / k move · enter open · x select · shift-click a header for a secondary sort · / focus the prompt
      </p>
    </div>
  )
}
