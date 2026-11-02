import { CircleCheck, Download, FileText, Plus, Radar } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { errorMessage } from '@/api/client'
import { useCreateReport, useFindings, useReports, useScans, useTargets } from '@/api/queries'
import { SeverityCounts } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Card, Page, PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { downloadBlob } from '@/lib/download'
import { formatRelative } from '@/lib/format'
import { toast } from '@/stores/toast'
import { useUiStore } from '@/stores/ui'
import type { Report, Scan } from '@/types/domain'
import { reportToPdf } from './reportPdf'

/** "Feb 18, 2026, 10:00" in the user's own locale and time zone. */
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function issueTotal(scan: Scan): number {
  const c = scan.findingsCount
  return c.critical + c.high + c.medium + c.low
}

function finishedAt(scan: Scan): string | null {
  if (!scan.startedAt) return null
  return new Date(new Date(scan.startedAt).getTime() + (scan.durationSec ?? 0) * 1000).toISOString()
}

function CreateReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create a report"
      description="Pick a completed scan. We'll turn its results into a PDF you can share."
    >
      {/* Mounted only while open, so the choice starts fresh every time. */}
      {open && <CreateReportForm onDone={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function CreateReportForm({ onDone }: { onDone: () => void }) {
  const { data: scans = [], isPending } = useScans()
  const { data: targets = [] } = useTargets()
  const openNewScan = useUiStore((s) => s.openNewScan)
  const create = useCreateReport()
  const [scanId, setScanId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const names = useMemo(() => new Map(targets.map((t) => [t.id, t.name])), [targets])
  const completed = useMemo(
    () =>
      scans
        .filter((s) => s.status === 'completed')
        .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? '')),
    [scans],
  )

  function submit() {
    if (!scanId) {
      setError('Choose a scan to report on.')
      return
    }
    create.mutate(scanId, { onSuccess: onDone, onError: (e) => setError(errorMessage(e)) })
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        {isPending ? (
          <SkeletonRows label="Loading scans" rows={3} columns={['w-1/2', 'w-1/4']} />
        ) : completed.length === 0 ? (
          <EmptyState
            className="py-8"
            icon={<Radar />}
            title="No completed scans yet"
            detail="Run a scan first. When it finishes, you can create a report from it here."
            action={
              <Button
                variant="primary"
                icon={<Plus aria-hidden />}
                onClick={() => {
                  onDone()
                  openNewScan()
                }}
              >
                New scan
              </Button>
            }
          />
        ) : (
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink">Completed scans</legend>
            <div className="flex flex-col gap-2">
              {completed.map((s) => {
                const checked = scanId === s.id
                const total = issueTotal(s)
                return (
                  <label
                    key={s.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
                      checked ? 'border-brand bg-brand-soft' : 'border-line hover:bg-surface-2',
                    )}
                  >
                    <input
                      type="radio"
                      name="scan"
                      value={s.id}
                      checked={checked}
                      onChange={() => {
                        setScanId(s.id)
                        setError(null)
                      }}
                      className="size-4 accent-[var(--brand)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">
                        {names.get(s.targetId) ?? 'Unknown website'}
                      </span>
                      <span className="block text-[13px] text-ink-3">
                        Finished {formatDate(finishedAt(s))} · Scan {s.id}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-[13px] text-ink-2">
                      {total} issue{total === 1 ? '' : 's'}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        )}
        {error && (
          <p role="alert" className="mt-3 text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2/60 px-6 py-4">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={create.isPending} disabled={completed.length === 0}>
          Create report
        </Button>
      </footer>
    </form>
  )
}

export function ReportsPage() {
  const reports = useReports()
  const { data: scans = [] } = useScans()
  const { data: findings = [] } = useFindings()
  const [params, setParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const scanById = useMemo(() => new Map(scans.map((s) => [s.id, s])), [scans])
  // ?create=1 (from the checklist or a link) opens the dialog on arrival; closing it drops the param.
  const createRequested = params.get('create') === '1'

  function setCreateOpen(open: boolean) {
    setDialogOpen(open)
    if (!open && createRequested) {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('create')
          return next
        },
        { replace: true },
      )
    }
  }

  function download(report: Report) {
    const pdf = reportToPdf(
      report,
      scanById.get(report.scanId),
      findings.filter((f) => f.scanId === report.scanId),
    )
    downloadBlob(
      pdf,
      `clearsite-${report.id}-${report.target.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
      'application/pdf',
    )
    toast.success('Report downloaded', `${report.target} · ${report.findings} issues`)
  }

  const createButton = (
    <Button variant="primary" icon={<Plus aria-hidden />} onClick={() => setCreateOpen(true)}>
      Create report
    </Button>
  )

  let body
  if (reports.isPending)
    body = (
      <SkeletonRows label="Loading reports" rows={4} columns={['w-8', 'w-1/3', 'w-24', 'w-28', 'w-32']} />
    )
  else if (reports.isError)
    body = (
      <ErrorState
        error={reports.error}
        resource="your reports"
        onRetry={() => void reports.refetch()}
        retrying={reports.isFetching}
      />
    )
  else if (reports.data.length === 0)
    body = (
      <EmptyState
        icon={<FileText />}
        title="No reports yet"
        detail="Create a PDF summary from any completed scan to share with your team."
        action={createButton}
      />
    )
  else
    body = (
      <ul aria-label="Reports" className="divide-y divide-line">
        {reports.data.map((r) => {
          const scan = scanById.get(r.scanId)
          return (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-surface-2/60"
            >
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-text"
              >
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate text-[14px] font-medium text-ink">
                  {r.target}, scan {r.scanId}
                </p>
                <p className="text-[13px] text-ink-3">
                  Created <time dateTime={r.createdAt}>{formatRelative(r.createdAt)}</time> ·{' '}
                  <Link to={`/findings?scan=${r.scanId}`} className="text-brand-text hover:underline">
                    {r.findings} issue{r.findings === 1 ? '' : 's'}
                  </Link>
                </p>
              </div>
              <div className="flex min-w-0 flex-1 basis-40 items-center">
                {scan ? (
                  <SeverityCounts counts={scan.findingsCount} />
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-3">
                    <CircleCheck aria-hidden className="size-3.5" />
                    PDF
                  </span>
                )}
              </div>
              <Button
                icon={<Download aria-hidden />}
                onClick={() => download(r)}
                aria-label={`Download PDF for ${r.target}, scan ${r.scanId}`}
              >
                Download PDF
              </Button>
            </li>
          )
        })}
      </ul>
    )

  return (
    <Page>
      <PageHeader
        title="Reports"
        description="A PDF of each finished scan: every issue, where it is, and how to fix it."
        actions={createButton}
      />
      <Card bodyClassName="overflow-hidden rounded-lg">{body}</Card>
      <CreateReportDialog open={dialogOpen || createRequested} onOpenChange={setCreateOpen} />
    </Page>
  )
}
