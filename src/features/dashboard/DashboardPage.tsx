import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useFindings, useScans, useTargets } from '@/api/queries'
import { ButtonLink } from '@/components/ui/Button'
import { IconPlay } from '@/components/ui/Icons'
import { PageHeader, Panel } from '@/components/ui/PageHeader'
import { ProgressRail } from '@/components/ui/ProgressRail'
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States'
import { SeverityStrip } from '@/components/ui/Tags'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatDuration, formatRelative } from '@/lib/format'
import { isOpenStatus } from '@/lib/labels'
import { ScanStatusMark } from '@/features/scans/ScanStatusMark'
import { SeverityBreakdown, SeverityTrend } from './Charts'
import { findingsPerDay, openBySeverity } from './stats'

/** Counts up once from 0 on first render (900 ms, ease-out). Static under reduced motion. */
function useCountUp(value: number | undefined): number | undefined {
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [shown, setShown] = useState<number | undefined>(undefined)
  useEffect(() => {
    if (value === undefined || reduce) return
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 900)
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, reduce])
  return reduce ? value : shown
}

function Readout({
  label,
  value,
  detail,
  to,
  tone,
  loading,
}: {
  label: string
  value: number | undefined
  detail: ReactNode
  to: string
  tone?: 'signal'
  loading: boolean
}) {
  const shown = useCountUp(value)
  return (
    <Link
      to={to}
      className="group flex min-w-0 flex-col gap-1 px-4 py-3 transition-colors hover:bg-panel-2 focus-visible:relative focus-visible:z-10"
    >
      <span className="label flex items-center justify-between group-hover:text-bone">
        {label}
        <span aria-hidden className="text-smoke group-hover:text-bone">
          ↵
        </span>
      </span>
      {loading ? (
        <Skeleton className="my-1 h-11 w-16" />
      ) : (
        <span
          className={cn(
            'font-display text-[58px] leading-[0.95]',
            tone === 'signal' ? 'text-signal' : 'text-bone',
          )}
        >
          {shown ?? '—'}
        </span>
      )}
      <span className="font-mono text-[11.5px] text-ash">{detail}</span>
    </Link>
  )
}

export function DashboardPage() {
  const targets = useTargets()
  const scans = useScans()
  const findings = useFindings()
  const now = useNow(60_000)

  const open = useMemo(() => (findings.data ?? []).filter((f) => isOpenStatus(f.status)), [findings.data])
  const bySeverity = useMemo(() => openBySeverity(findings.data ?? []), [findings.data])
  const trend = useMemo(() => findingsPerDay(findings.data ?? [], 30, now), [findings.data, now])
  const recent = useMemo(() => (scans.data ?? []).slice(0, 6), [scans.data])
  const targetName = useMemo(() => new Map((targets.data ?? []).map((t) => [t.id, t.name])), [targets.data])

  const running = scans.data?.filter((s) => s.status === 'running').length ?? 0
  const prodTargets = targets.data?.filter((t) => t.environment === 'production').length ?? 0
  const confirmedCount = open.filter((f) => f.status === 'confirmed').length
  const anyError = targets.error ?? scans.error ?? findings.error

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        title="Situation report"
        meta={`last 30 days · ${targets.data?.length ?? '–'} targets in scope`}
        actions={
          <ButtonLink to="/scans?new=1" variant="primary" icon={<IconPlay />}>
            New scan
          </ButtonLink>
        }
      />

      {anyError && (
        <Panel>
          <ErrorState
            error={anyError}
            resource="/api"
            onRetry={() => {
              void targets.refetch()
              void scans.refetch()
              void findings.refetch()
            }}
          />
        </Panel>
      )}

      <Panel label="status">
        <div className="grid grid-cols-2 divide-wire-2 lg:grid-cols-4 lg:divide-x lg:divide-dashed">
          <Readout
            label="Targets"
            value={targets.data?.length}
            loading={targets.isPending}
            to="/targets"
            detail={`${prodTargets} in production`}
          />
          <Readout
            label="Scans run"
            value={scans.data?.filter((s) => s.status === 'completed' || s.status === 'failed').length}
            loading={scans.isPending}
            to="/scans"
            detail={running ? `${running} running now` : 'none running'}
          />
          <Readout
            label="Open findings"
            value={open.length}
            loading={findings.isPending}
            to="/findings?status=open,confirmed"
            detail={`${confirmedCount} confirmed`}
          />
          <Readout
            label="Critical open"
            value={bySeverity.critical}
            loading={findings.isPending}
            to="/findings?sev=critical&status=open,confirmed"
            tone="signal"
            detail="exploitable, fix first"
          />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel
          label="open by severity"
          meta={
            <Link to="/findings?status=open,confirmed" className="hover:text-bone">
              view all ›
            </Link>
          }
        >
          <div className="px-4 py-5">
            {findings.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <SeverityBreakdown counts={bySeverity} />
            )}
          </div>
        </Panel>
        <Panel label="new findings / day · 30d">
          <div className="px-4 py-5">
            {findings.isPending ? <Skeleton className="h-44 w-full" /> : <SeverityTrend days={trend} />}
          </div>
        </Panel>
      </div>

      <Panel
        label="recent operations"
        meta={
          <Link to="/scans" className="hover:text-bone">
            all scans ›
          </Link>
        }
      >
        {scans.isPending ? (
          <SkeletonRows label="fetching /api/scans" rows={4} columns={['w-16', 'w-24', 'w-1/3', 'w-20']} />
        ) : scans.isError ? (
          <ErrorState error={scans.error} resource="/api/scans" onRetry={() => void scans.refetch()} />
        ) : recent.length === 0 ? (
          <EmptyState title="0 scans yet" detail="Launch a scan against a target to see it here." />
        ) : (
          <ul className="divide-y divide-dashed divide-wire">
            {recent.map((scan) => (
              <li key={scan.id}>
                <Link
                  to={scan.status === 'completed' ? `/findings?scan=${scan.id}` : '/scans'}
                  className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 px-4 py-3 hover:bg-panel-2 sm:grid-cols-[96px_160px_minmax(0,1fr)_88px]"
                >
                  <ScanStatusMark status={scan.status} />
                  <span className="min-w-0 truncate text-[13px] text-bone">
                    {targetName.get(scan.targetId) ?? scan.targetId}
                    <span className="block font-mono text-[11px] text-smoke">{scan.id}</span>
                  </span>
                  <span className="col-span-2 min-w-0 sm:col-span-1">
                    {scan.status === 'running' ? (
                      <ProgressRail progress={scan.progress} label={`${scan.id} progress`} />
                    ) : scan.status === 'queued' ? (
                      <span className="font-mono text-[12px] text-ash">waiting in queue</span>
                    ) : scan.status === 'failed' ? (
                      <span className="font-mono text-[12px] text-signal">aborted at {scan.progress}%</span>
                    ) : (
                      <SeverityStrip counts={scan.findingsCount} />
                    )}
                  </span>
                  <span className="hidden text-right font-mono text-[11.5px] text-ash sm:block">
                    {scan.status === 'running'
                      ? formatDuration(scan.durationSec)
                      : formatRelative(scan.startedAt, now)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
