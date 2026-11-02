import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFindings, useSetFindingStatus, useTargets } from '@/api/queries'
import { Plus, Radar, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States'
import { findingsToCsv } from '@/lib/csv'
import { downloadBlob } from '@/lib/download'
import { isOpenStatus } from '@/lib/labels'
import { STATUS_LABEL } from '@/lib/labels'
import { toast } from '@/stores/toast'
import { useUiStore } from '@/stores/ui'
import type { FindingStatus } from '@/types/domain'
import { applyQuery, facetCounts } from './applyQuery'
import { BulkBar } from './BulkBar'
import { FilterBar, QuickViews } from './FilterBar'
import { FindingsCards, FindingsTable } from './FindingsTable'
import { EMPTY_QUERY, PAGE_SIZES, type FindingsQuery, type SortKey } from './query'
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
  const openNewScan = useUiStore((s) => s.openNewScan)

  const findings = useMemo(() => findingsQuery.data ?? [], [findingsQuery.data])
  const targetNames = useMemo(() => new Map(targets.map((t) => [t.id, t.name])), [targets])
  const ctx = useMemo(() => ({ targetNames }), [targetNames])

  // The whole pipeline is memoised on (data, query): typing in unrelated inputs never re-filters.
  const result = useMemo(() => applyQuery(findings, query, ctx), [findings, query, ctx])
  const counts = useMemo(() => facetCounts(findings, query, ctx), [findings, query, ctx])
  const openCount = useMemo(() => findings.filter((f) => isOpenStatus(f.status)).length, [findings])
  const siteCount = useMemo(
    () => new Set(findings.filter((f) => isOpenStatus(f.status)).map((f) => f.targetId)).size,
    [findings],
  )

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
      `clearsite-issues-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv',
    )
    toast.success('CSV downloaded', `${result.matched.length} issues from the current view`)
  }

  function bulkSet(status: FindingStatus) {
    const ids = [...selected]
    setStatus.mutate(
      { ids, status },
      {
        onSuccess: () => {
          toast.success(
            `${ids.length} issue${ids.length === 1 ? '' : 's'} updated`,
            `Marked as “${STATUS_LABEL[status]}”`,
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

  const clearFilters = () => update({ ...EMPTY_QUERY, sort: query.sort, pageSize: query.pageSize })

  let body
  if (findingsQuery.isPending) {
    body = (
      <SkeletonRows
        label="Loading issues"
        columns={['w-4', 'w-20', 'w-2/5', 'w-32', 'w-24', 'w-20', 'w-16']}
      />
    )
  } else if (findingsQuery.isError) {
    body = (
      <ErrorState
        error={findingsQuery.error}
        resource="your issues"
        onRetry={() => void findingsQuery.refetch()}
        retrying={findingsQuery.isFetching}
      />
    )
  } else if (findings.length === 0) {
    body = (
      <EmptyState
        icon={<Radar />}
        title="No issues yet"
        detail="Issues appear here when a scan finishes. Start a scan on one of your websites to find them."
        action={
          <Button variant="primary" icon={<Plus aria-hidden />} onClick={() => openNewScan()}>
            Start a scan
          </Button>
        }
      />
    )
  } else if (result.total === 0) {
    body = (
      <EmptyState
        icon={<SearchX />}
        title="No issues match these filters"
        detail="Try a different search, or remove a filter to see more."
        action={<Button onClick={clearFilters}>Clear filters</Button>}
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
          noun="issues"
          onPage={(page) => update({ page })}
          onPageSize={(pageSize) => update({ pageSize })}
        />
      </>
    )
  }

  return (
    <Page>
      <PageHeader
        title="Issues"
        description={
          findingsQuery.data
            ? openCount === 0
              ? 'Nothing needs your attention right now.'
              : `${openCount} open issue${openCount === 1 ? '' : 's'} across ${siteCount} website${siteCount === 1 ? '' : 's'}. Start with the most severe.`
            : findingsQuery.isError
              ? 'Problems found on your websites, and how to fix them.'
              : 'Loading your issues…'
        }
      />
      <p className="sr-only" aria-live="polite">
        {findingsQuery.data ? `${result.total} issues match.` : ''}
      </p>
      <section aria-label="Issues" className="card overflow-hidden">
        {findingsQuery.data && findings.length > 0 && (
          <QuickViews query={query} counts={counts} onChange={onChange} />
        )}
        <FilterBar
          query={query}
          counts={counts}
          targets={targets}
          onChange={onChange}
          onApplyView={(search) => navigate({ pathname: '/findings', search })}
          onExport={exportCsv}
          exportCount={result.total}
        />
        {body}
      </section>
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
    </Page>
  )
}
