import { ChevronRight, Plus, Radar, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateScan, useScans, useTargets } from '@/api/queries'
import { SeverityCounts } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Card, Page, PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatRelative, formatUtc } from '@/lib/format'
import { SCAN_STATUS_LABEL } from '@/lib/labels'
import { useUiStore } from '@/stores/ui'
import { SCAN_STATUSES, type Scan, type ScanStatus } from '@/types/domain'
import { ScanStatusBadge } from './ScanStatusBadge'

/** A friendly description of what a running scan is doing, picked from its progress. */
const STEPS = [
  'Mapping pages…',
  'Checking forms…',
  'Testing logins…',
  'Checking the checkout page…',
  'Wrapping up…',
]
function stepFor(progress: number) {
  return STEPS[Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length))] ?? STEPS[0]
}

/** 742 -> "12m 22s", 38 -> "38s", 3725 -> "1h 2m". */
function friendlyDuration(sec: number | null): string {
  if (sec === null) return '—'
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${r}s`
  return `${r}s`
}

export function ScansPage() {
  const scans = useScans()
  const { data: targets = [] } = useTargets()
  const createScan = useCreateScan()
  const openNewScan = useUiStore((s) => s.openNewScan)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const now = useNow()

  const raw = params.get('status')
  const filter = (SCAN_STATUSES as readonly string[]).includes(raw ?? '') ? (raw as ScanStatus) : null
  const targetName = useMemo(() => new Map(targets.map((t) => [t.id, t.name])), [targets])

  // Older deep links (`/scans?new=1&target=…`) still open the New scan dialog.
  useEffect(() => {
    if (params.get('new') !== '1') return
    openNewScan(params.get('target') ?? undefined)
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('new')
        next.delete('target')
        return next
      },
      { replace: true },
    )
  }, [params, setParams, openNewScan])

  const rows = useMemo(
    () => (scans.data ?? []).filter((s) => !filter || s.status === filter),
    [scans.data, filter],
  )
  const countBy = (status: ScanStatus) => scans.data?.filter((s) => s.status === status).length ?? 0

  function setFilter(status: ScanStatus | null) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (status) next.set('status', status)
      else next.delete('status')
      return next
    })
  }

  const openFindings = (scan: Scan) => navigate(`/findings?scan=${scan.id}`)
  const nameOf = (scan: Scan) => targetName.get(scan.targetId) ?? 'Unknown website'

  function onRowKey(e: KeyboardEvent, scan: Scan) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openFindings(scan)
    }
  }

  /** What the last column shows for each state. */
  function detail(scan: Scan): ReactNode {
    if (scan.status === 'running')
      return (
        <div className="min-w-0">
          <ProgressBar progress={scan.progress} label={`Scan of ${nameOf(scan)} progress`} />
          <p className="mt-1 text-[13px] text-ink-3">{stepFor(scan.progress)}</p>
        </div>
      )
    if (scan.status === 'queued') return <span className="text-[13px] text-ink-3">Waiting to start</span>
    if (scan.status === 'failed')
      return (
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] text-danger">Couldn&rsquo;t reach the site</span>
          <Button
            size="sm"
            icon={<RotateCcw aria-hidden />}
            loading={createScan.isPending && createScan.variables === scan.targetId}
            onClick={(e) => {
              e.stopPropagation()
              createScan.mutate(scan.targetId)
            }}
            aria-label={`Retry scan of ${nameOf(scan)}`}
          >
            Retry
          </Button>
        </span>
      )
    return (
      <span className="flex items-center justify-between gap-3">
        <SeverityCounts counts={scan.findingsCount} />
        <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-3" />
      </span>
    )
  }

  const started = (scan: Scan) =>
    scan.startedAt ? (
      <span title={formatUtc(scan.startedAt)}>{formatRelative(scan.startedAt, now)}</span>
    ) : (
      '—'
    )

  let body
  if (scans.isPending)
    body = <SkeletonRows label="Loading your scans" columns={['w-36', 'w-20', 'w-20', 'w-16', 'w-1/4']} />
  else if (scans.isError)
    body = (
      <ErrorState
        error={scans.error}
        resource="your scans"
        onRetry={() => void scans.refetch()}
        retrying={scans.isFetching}
      />
    )
  else if (rows.length === 0)
    body = filter ? (
      <EmptyState
        icon={<Radar />}
        title={`No ${SCAN_STATUS_LABEL[filter].toLowerCase()} scans`}
        detail="Scans with this status will show up here."
        action={<Button onClick={() => setFilter(null)}>Show all scans</Button>}
      />
    ) : (
      <EmptyState
        icon={<Radar />}
        title="No scans yet"
        detail="Start a scan to check one of your websites for security issues. It runs in the background."
        action={
          <Button variant="primary" icon={<Plus aria-hidden />} onClick={() => openNewScan()}>
            New scan
          </Button>
        }
      />
    )
  else
    body = (
      <>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <caption className="sr-only">Scans. Completed scans open the issues they found.</caption>
            <thead>
              <tr className="border-y border-line bg-surface-2/60">
                {['Website', 'Status', 'Started', 'Duration', 'Issues found'].map((h) => (
                  <th key={h} scope="col" className="label px-5 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((scan) => {
                const clickable = scan.status === 'completed'
                return (
                  <tr
                    key={scan.id}
                    onClick={clickable ? () => openFindings(scan) : undefined}
                    onKeyDown={clickable ? (e) => onRowKey(e, scan) : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    aria-label={clickable ? `Scan of ${nameOf(scan)}: view issues found` : undefined}
                    className={cn(
                      'border-b border-line last:border-b-0',
                      clickable && 'cursor-pointer hover:bg-surface-2/60',
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[14px] font-medium text-ink">{nameOf(scan)}</p>
                      <p className="text-[12.5px] text-ink-3">Scan #{scan.id.replace(/^scan_/, '')}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <ScanStatusBadge status={scan.status} />
                    </td>
                    <td className="tabular px-5 py-3.5 text-[14px] text-ink-2">{started(scan)}</td>
                    <td className="tabular px-5 py-3.5 text-[14px] text-ink-2">
                      {friendlyDuration(scan.durationSec)}
                    </td>
                    <td className="w-[34%] px-5 py-3.5">{detail(scan)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line border-t border-line md:hidden" aria-label="Scans">
          {rows.map((scan) => {
            const clickable = scan.status === 'completed'
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-ink">{nameOf(scan)}</p>
                    <p className="text-[12.5px] text-ink-3">
                      {started(scan)} · {friendlyDuration(scan.durationSec)}
                    </p>
                  </div>
                  <ScanStatusBadge status={scan.status} className="shrink-0" />
                </div>
                <div className="mt-3">{detail(scan)}</div>
              </>
            )
            return (
              <li key={scan.id}>
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => openFindings(scan)}
                    className="block w-full px-5 py-4 text-left hover:bg-surface-2/60"
                    aria-label={`Scan of ${nameOf(scan)}: view issues found`}
                  >
                    {content}
                  </button>
                ) : (
                  <div className="px-5 py-4">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      </>
    )

  const running = countBy('running')

  return (
    <Page>
      <PageHeader
        title="Scans"
        description={
          running > 0
            ? `${running} scan${running === 1 ? '' : 's'} running now. Progress updates live.`
            : 'Check your websites for security issues. Open a finished scan to see what it found.'
        }
        actions={
          <Button variant="primary" icon={<Plus aria-hidden />} onClick={() => openNewScan()}>
            New scan
          </Button>
        }
      />
      <Card>
        <div className="overflow-x-auto px-5 py-4">
          <div
            role="group"
            aria-label="Filter by status"
            className="inline-flex gap-1 rounded-lg bg-surface-2 p-1"
          >
            {[null, ...SCAN_STATUSES].map((s) => {
              const active = filter === s
              return (
                <button
                  key={s ?? 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(s)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors',
                    active ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
                  )}
                >
                  {s ? SCAN_STATUS_LABEL[s] : 'All'}
                  <span className={cn('tabular', active ? 'text-ink-2' : 'text-ink-3')}>
                    {s ? countBy(s) : (scans.data?.length ?? 0)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        {body}
      </Card>
    </Page>
  )
}
