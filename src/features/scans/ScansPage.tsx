import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useScans, useTargets } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { IconPlay } from '@/components/ui/Icons'
import { PageHeader, Panel } from '@/components/ui/PageHeader'
import { ProgressRail } from '@/components/ui/ProgressRail'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States'
import { SeverityStrip } from '@/components/ui/Tags'
import { cn } from '@/lib/cn'
import { formatDuration, formatUtc } from '@/lib/format'
import { SCAN_STATUSES, type Scan, type ScanStatus } from '@/types/domain'
import { NewScanDialog } from './NewScanDialog'
import { ScanStatusMark } from './ScanStatusMark'

/** Rotating one-line log tail shown under a running scan; picked from progress so it is stable per tick. */
const PHASES = [
  'crawling sitemap and links',
  'fingerprinting server and frameworks',
  'testing authentication flows',
  'fuzzing query parameters',
  'probing access control on objects',
  'checking TLS and security headers',
  'replaying payloads to confirm',
]
function phaseFor(progress: number) {
  return PHASES[Math.min(PHASES.length - 1, Math.floor((progress / 100) * PHASES.length))] ?? PHASES[0]
}

export function ScansPage() {
  const scans = useScans()
  const { data: targets = [] } = useTargets()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const filter = params.get('status') as ScanStatus | null
  const dialogOpen = params.get('new') === '1'
  const targetName = useMemo(() => new Map(targets.map((t) => [t.id, t.name])), [targets])

  const rows = useMemo(
    () => (scans.data ?? []).filter((s) => !filter || s.status === filter),
    [scans.data, filter],
  )
  const countBy = (status: ScanStatus) => scans.data?.filter((s) => s.status === status).length ?? 0

  function setDialog(open: boolean) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (open) next.set('new', '1')
        else {
          next.delete('new')
          next.delete('target')
        }
        return next
      },
      { replace: true },
    )
  }

  function setFilter(status: ScanStatus | null) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (status) next.set('status', status)
      else next.delete('status')
      return next
    })
  }

  function openRow(scan: Scan) {
    if (scan.status === 'completed') navigate(`/findings?scan=${scan.id}`)
  }

  let body
  if (scans.isPending)
    body = (
      <SkeletonRows label="fetching /api/scans" columns={['w-20', 'w-16', 'w-32', 'w-28', 'w-14', 'w-1/4']} />
    )
  else if (scans.isError)
    body = (
      <ErrorState
        error={scans.error}
        resource="/api/scans"
        onRetry={() => void scans.refetch()}
        retrying={scans.isFetching}
      />
    )
  else if (rows.length === 0)
    body = filter ? (
      <EmptyState
        title={`0 scans with status ${filter}`}
        action={<Button onClick={() => setFilter(null)}>Show all scans</Button>}
      />
    ) : (
      <EmptyState
        title="0 scans on record"
        detail="Launch the first scan to start finding vulnerabilities."
        action={
          <Button variant="primary" icon={<IconPlay />} onClick={() => setDialog(true)}>
            New scan
          </Button>
        }
      />
    )
  else
    body = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <caption className="sr-only">Scan runs. Completed scans open their findings.</caption>
          <thead>
            <tr className="border-b border-wire">
              {['Status', 'Scan', 'Target', 'Started (UTC)', 'Duration', 'Findings / progress'].map((h) => (
                <th key={h} scope="col" className="label px-4 py-2.5">
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
                  onClick={() => openRow(scan)}
                  className={cn(
                    'border-b border-wire',
                    clickable && 'cursor-pointer hover:bg-panel-2',
                    scan.status === 'running' && 'bg-live/[0.04]',
                  )}
                >
                  <td className="px-4 py-3">
                    <ScanStatusMark status={scan.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[12.5px]">
                    {clickable ? (
                      <Link
                        to={`/findings?scan=${scan.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-bone hover:underline"
                      >
                        {scan.id}
                      </Link>
                    ) : (
                      <span className="text-bone">{scan.id}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-bone">
                    {targetName.get(scan.targetId) ?? scan.targetId}
                  </td>
                  <td className="tabular px-4 py-3 font-mono text-[12px] text-ash">
                    {formatUtc(scan.startedAt)}
                  </td>
                  <td className="tabular px-4 py-3 font-mono text-[12px] text-ash">
                    {formatDuration(scan.durationSec)}
                  </td>
                  <td className="w-[38%] px-4 py-3">
                    {scan.status === 'running' ? (
                      <div>
                        <ProgressRail progress={scan.progress} label={`${scan.id} progress`} />
                        <p className="mt-1 font-mono text-[11px] text-ash">
                          <span className="text-live">&gt;</span> {phaseFor(scan.progress)}
                          <span className="ml-0.5 animate-blink">_</span>
                        </p>
                      </div>
                    ) : scan.status === 'queued' ? (
                      <span className="font-mono text-[12px] text-ash">queued, starts in a few seconds</span>
                    ) : scan.status === 'failed' ? (
                      <span className="font-mono text-[12px] text-signal">
                        aborted at {scan.progress}%: target stopped responding
                      </span>
                    ) : (
                      <span className="flex items-center justify-between gap-3">
                        <SeverityStrip counts={scan.findingsCount} />
                        <span aria-hidden className="font-mono text-[12px] text-smoke">
                          ›
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )

  return (
    <div className="flex flex-col gap-5 px-4 py-6 md:px-6">
      <PageHeader
        title="Scans"
        meta={
          scans.data
            ? `${countBy('running')} running · ${countBy('queued')} queued · ${scans.data.length} total`
            : scans.isError
              ? 'could not load scans'
              : 'loading scans'
        }
        actions={
          <Button variant="primary" icon={<IconPlay />} onClick={() => setDialog(true)}>
            New scan
          </Button>
        }
      />
      <Panel label="Scan runs">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap gap-1 border-b border-wire px-4 py-3"
        >
          {[null, ...SCAN_STATUSES].map((s) => (
            <button
              key={s ?? 'all'}
              type="button"
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
              className={cn(
                'h-7 rounded-xs border px-2.5 font-mono text-[11.5px]',
                filter === s ? 'border-bone bg-panel-2 text-bone' : 'border-wire text-ash hover:text-bone',
              )}
            >
              {s ?? 'all'}{' '}
              <span className="tabular text-smoke">{s ? countBy(s) : (scans.data?.length ?? 0)}</span>
            </button>
          ))}
        </div>
        {body}
      </Panel>
      <NewScanDialog
        open={dialogOpen}
        onOpenChange={setDialog}
        initialTargetId={params.get('target') ?? undefined}
      />
    </div>
  )
}
