import { ArrowRight, Globe, Plus, Radar } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useFindings, useReports, useScans, useTargets } from '@/api/queries'
import { SeverityBadge, SeverityCounts } from '@/components/ui/Badges'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, Page } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatRelative, pluralize } from '@/lib/format'
import { isOpenStatus, SCAN_STATUS_LABEL, SEVERITY_RANK } from '@/lib/labels'
import { useUiStore } from '@/stores/ui'
import type { ScanStatus } from '@/types/domain'
import { IssuesOverTime, SeverityDonut } from './Charts'
import { GetStartedChecklist } from './GetStartedChecklist'
import { checklistSteps, findingsPerDay, openBySeverity, openSince } from './stats'

const linkClass = 'inline-flex items-center gap-1 text-[14px] font-medium text-brand-text hover:underline'

/** One cell of the stats strip. The whole cell is a link to the matching filtered view. */
function Stat({
  label,
  value,
  detail,
  to,
  urgent,
  loading,
}: {
  label: string
  value: number | undefined
  detail: ReactNode
  to: string
  urgent?: boolean
  loading: boolean
}) {
  return (
    <Link to={to} className="flex min-w-0 flex-col gap-1 bg-surface p-5 transition-colors hover:bg-surface-2">
      <span className="text-[13px] text-ink-2">{label}</span>
      {loading ? (
        <Skeleton className="my-1 h-8 w-14" />
      ) : (
        <span
          className={cn(
            'display tabular text-[32px] leading-10 font-semibold',
            urgent && value ? 'text-sev-critical' : 'text-ink',
          )}
        >
          {value ?? 0}
        </span>
      )}
      <span className="text-[13px] text-ink-3">{detail}</span>
    </Link>
  )
}

const SCAN_TAG: Record<ScanStatus, string> = {
  queued: 'bg-surface-2 text-ink-2',
  running: 'bg-brand-soft text-brand-text',
  completed: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
}

function ScanTag({ status }: { status: ScanStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[12.5px] font-medium whitespace-nowrap',
        SCAN_TAG[status],
      )}
    >
      {SCAN_STATUS_LABEL[status]}
    </span>
  )
}

export function DashboardPage() {
  useDocumentTitle('Overview')
  const targets = useTargets()
  const scans = useScans()
  const findings = useFindings()
  const reports = useReports()
  const openNewScan = useUiStore((s) => s.openNewScan)
  const now = useNow(60_000)

  const all = useMemo(() => findings.data ?? [], [findings.data])
  const open = useMemo(() => all.filter((f) => isOpenStatus(f.status)), [all])
  const bySeverity = useMemo(() => openBySeverity(all), [all])
  const thisWeek = useMemo(() => openSince(all, 7, now), [all, now])
  const trend = useMemo(() => findingsPerDay(all, 30, now), [all, now])
  const recent = useMemo(() => (scans.data ?? []).slice(0, 5), [scans.data])
  const targetName = useMemo(() => new Map((targets.data ?? []).map((t) => [t.id, t.name])), [targets.data])
  // Most severe first, then newest: the five things a beginner should look at today.
  const fixFirst = useMemo(
    () =>
      [...open]
        .sort(
          (a, b) =>
            SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
            b.discoveredAt.localeCompare(a.discoveredAt),
        )
        .slice(0, 5),
    [open],
  )
  const sitesWithIssues = useMemo(() => new Set(open.map((f) => f.targetId)).size, [open])

  const running = scans.data?.filter((s) => s.status === 'running' || s.status === 'queued').length ?? 0
  const anyError = targets.error ?? scans.error ?? findings.error

  // The checklist only renders once its own inputs have loaded, so it never flashes "0 of 4".
  const checklistReady = targets.isSuccess && scans.isSuccess && findings.isSuccess
  const done = checklistSteps({
    targets: targets.data?.length ?? 0,
    scans: scans.data?.length ?? 0,
    reviewed: all.some((f) => f.status !== 'open'),
    // Reports can fail transiently (and auto-retry); until they load, that step simply reads as not done.
    reports: reports.data?.length ?? 0,
  })

  const noTargets = targets.isSuccess && targets.data.length === 0

  // The headline is the page's one bold element: a plain sentence built from the real numbers.
  let headline: ReactNode = <Skeleton className="h-11 w-3/4" />
  if (findings.isSuccess) {
    headline =
      open.length === 0 ? (
        <>
          No open issues.
          <span className="block text-ink-2">Your websites look good.</span>
        </>
      ) : (
        <>
          {pluralize(open.length, 'open issue')} on {pluralize(sitesWithIssues, 'website')}.
          <span className="block text-ink-2">
            {bySeverity.critical
              ? `${bySeverity.critical} ${bySeverity.critical === 1 ? 'needs' : 'need'} fixing today.`
              : 'Nothing critical right now.'}
          </span>
        </>
      )
  } else if (findings.isError) {
    headline = 'Overview'
  }

  return (
    <Page>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <h1 className="display max-w-3xl text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[44px]">
          {headline}
        </h1>
        <ButtonLink to="/findings?status=open,confirmed" icon={<ArrowRight aria-hidden />}>
          View all issues
        </ButtonLink>
      </header>

      {checklistReady && <GetStartedChecklist done={done} />}

      {anyError && (
        <Card>
          <ErrorState
            error={anyError}
            resource="your overview"
            onRetry={() => {
              void targets.refetch()
              void scans.refetch()
              void findings.refetch()
            }}
            retrying={targets.isFetching || scans.isFetching || findings.isFetching}
          />
        </Card>
      )}

      {noTargets ? (
        <Card>
          <EmptyState
            icon={<Globe />}
            title="No websites yet"
            detail="Add your first website or API and Clearsite will scan it for security problems."
            action={
              <ButtonLink to="/targets?add=1" variant="primary" icon={<Plus aria-hidden />}>
                Add website
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <>
          <nav
            aria-label="Summary"
            className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line xl:grid-cols-4"
          >
            <Stat
              label="Websites"
              value={targets.data?.length}
              loading={targets.isPending}
              to="/targets"
              detail="All websites and APIs"
            />
            <Stat
              label="Scans run"
              value={scans.data?.length}
              loading={scans.isPending}
              to="/scans"
              detail={running ? `${running} running now` : 'None running'}
            />
            <Stat
              label="Open issues"
              value={open.length}
              loading={findings.isPending}
              to="/findings?status=open,confirmed"
              detail={thisWeek ? `${thisWeek} new this week` : 'None new this week'}
            />
            <Stat
              label="Fix today"
              urgent
              value={bySeverity.critical}
              loading={findings.isPending}
              to="/findings?sev=critical&status=open,confirmed"
              detail={bySeverity.critical ? 'Critical severity' : 'No critical issues'}
            />
          </nav>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card
              title="Fix first"
              description="Your most severe open issues, newest first."
              action={
                open.length > 0 ? (
                  <Link to="/findings?status=open,confirmed" className={linkClass}>
                    See all {open.length} open issues <ArrowRight aria-hidden className="size-4" />
                  </Link>
                ) : undefined
              }
            >
              {findings.isPending ? (
                <SkeletonRows label="Loading issues" rows={5} columns={['w-16', 'w-1/2', 'w-24']} />
              ) : fixFirst.length === 0 ? (
                <p className="border-t border-line px-5 py-8 text-center text-[14px] text-ink-2">
                  Nothing to fix. New issues from your scans will show up here.
                </p>
              ) : (
                <ul className="divide-y divide-line border-t border-line">
                  {fixFirst.map((f) => (
                    <li
                      key={f.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-5 py-3.5 sm:grid-cols-[88px_minmax(0,1fr)_auto]"
                    >
                      <SeverityBadge severity={f.severity} className="justify-self-start" />
                      <div className="min-w-0">
                        <Link
                          to={`/findings/${f.id}`}
                          className="block truncate text-[14px] font-medium text-ink hover:underline"
                        >
                          {f.title}
                        </Link>
                        <p className="truncate text-[13px] text-ink-3">
                          {targetName.get(f.targetId) ?? 'Removed website'}
                        </p>
                      </div>
                      <Link
                        to={`/findings/${f.id}`}
                        className={cn(linkClass, 'col-start-2 text-[13px] sm:col-start-auto')}
                        aria-label={`How to fix: ${f.title}`}
                      >
                        How to fix <ArrowRight aria-hidden className="size-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Open issues by severity"
              description="Select a severity to see those issues."
              bodyClassName="px-5 pb-5"
            >
              {findings.isPending ? (
                <Skeleton className="h-44 w-full" />
              ) : (
                <SeverityDonut counts={bySeverity} />
              )}
            </Card>
          </div>

          <Card
            title="New issues over time"
            description="Issues found per day over the last 30 days."
            bodyClassName="px-5 pb-5"
          >
            {findings.isPending ? <Skeleton className="h-56 w-full" /> : <IssuesOverTime days={trend} />}
          </Card>

          <Card
            title="Recent scans"
            action={
              <Link to="/scans" className={linkClass}>
                All scans <ArrowRight aria-hidden className="size-4" />
              </Link>
            }
          >
            {scans.isPending ? (
              <SkeletonRows
                label="Loading recent scans"
                rows={4}
                columns={['w-32', 'w-20', 'w-1/3', 'w-16']}
              />
            ) : scans.isError ? (
              <ErrorState error={scans.error} resource="recent scans" onRetry={() => void scans.refetch()} />
            ) : recent.length === 0 ? (
              <EmptyState
                icon={<Radar />}
                title="No scans yet"
                detail="Run a scan to check one of your websites for problems."
                action={
                  <Button variant="primary" onClick={() => openNewScan()} icon={<Plus aria-hidden />}>
                    New scan
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {recent.map((scan) => (
                  <li key={scan.id}>
                    <Link
                      to={scan.status === 'completed' ? `/findings?scan=${scan.id}` : '/scans'}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface-2 sm:grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1.6fr)_90px]"
                    >
                      <span className="min-w-0 truncate text-[14px] font-medium text-ink">
                        {targetName.get(scan.targetId) ?? 'Removed website'}
                      </span>
                      <span className="justify-self-end sm:justify-self-start">
                        <ScanTag status={scan.status} />
                      </span>
                      <span className="col-span-2 min-w-0 sm:col-span-1">
                        {scan.status === 'running' ? (
                          <ProgressBar
                            progress={scan.progress}
                            label={`Scan progress for ${targetName.get(scan.targetId) ?? 'website'}`}
                          />
                        ) : scan.status === 'queued' ? (
                          <span className="text-[13px] text-ink-3">Waiting to start</span>
                        ) : scan.status === 'failed' ? (
                          <span className="text-[13px] text-danger">Couldn’t reach the site</span>
                        ) : (
                          <SeverityCounts counts={scan.findingsCount} />
                        )}
                      </span>
                      <span className="hidden text-right text-[13px] text-ink-3 sm:block">
                        {formatRelative(scan.startedAt, now)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </Page>
  )
}
