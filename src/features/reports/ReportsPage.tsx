import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/api/client'
import { useCreateReport, useFindings, useReports, useScans } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { SelectField } from '@/components/ui/Field'
import { IconDownload, IconPlus } from '@/components/ui/Icons'
import { PageHeader, Panel } from '@/components/ui/PageHeader'
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States'
import { SeverityStrip } from '@/components/ui/Tags'
import { downloadBlob } from '@/lib/download'
import { formatUtc } from '@/lib/format'
import { toast } from '@/stores/toast'
import type { Report } from '@/types/domain'
import { useTargets } from '@/api/queries'
import { reportToPdf } from './reportPdf'

function GenerateReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: scans = [] } = useScans()
  const { data: targets = [] } = useTargets()
  const create = useCreateReport()
  const [scanId, setScanId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const names = new Map(targets.map((t) => [t.id, t.name]))
  const completed = scans.filter((s) => s.status === 'completed')

  function generate() {
    if (!scanId) {
      setError('Choose a completed scan.')
      return
    }
    create.mutate(scanId, {
      onSuccess: () => {
        onOpenChange(false)
        setScanId('')
      },
      onError: (e) => setError(errorMessage(e)),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setError(null)
      }}
      eyebrow="reports/new"
      title="Generate report"
      description="Only completed scans can be reported on."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={generate} loading={create.isPending}>
            Generate
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          generate()
        }}
      >
        <SelectField
          label="Scan"
          value={scanId}
          onChange={(e) => {
            setScanId(e.target.value)
            setError(null)
          }}
          placeholder={completed.length ? 'Choose a completed scan' : 'No completed scans yet'}
          error={error ?? undefined}
          options={completed.map((s) => {
            const total =
              s.findingsCount.critical + s.findingsCount.high + s.findingsCount.medium + s.findingsCount.low
            return {
              value: s.id,
              label: `${s.id} · ${names.get(s.targetId) ?? s.targetId} · ${formatUtc(s.startedAt)} · ${total} findings`,
            }
          })}
        />
      </form>
    </Dialog>
  )
}

export function ReportsPage() {
  const reports = useReports()
  const { data: scans = [] } = useScans()
  const { data: findings = [] } = useFindings()
  const [dialogOpen, setDialogOpen] = useState(false)
  const scanById = useMemo(() => new Map(scans.map((s) => [s.id, s])), [scans])

  function download(report: Report) {
    const scan = scanById.get(report.scanId)
    const pdf = reportToPdf(
      report,
      scan,
      findings.filter((f) => f.scanId === report.scanId),
    )
    downloadBlob(
      pdf,
      `${report.id}-${report.target.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
      'application/pdf',
    )
    toast.success(`${report.id}.pdf downloaded`, `${report.target} · ${report.findings} findings`)
  }

  let body
  if (reports.isPending)
    body = (
      <SkeletonRows
        label="fetching /api/reports"
        rows={4}
        columns={['w-16', 'w-32', 'w-20', 'w-40', 'w-24', 'w-20']}
      />
    )
  else if (reports.isError)
    body = (
      <ErrorState
        error={reports.error}
        resource="/api/reports"
        onRetry={() => void reports.refetch()}
        retrying={reports.isFetching}
      />
    )
  else if (reports.data.length === 0)
    body = (
      <EmptyState
        title="0 reports generated"
        detail="Generate a PDF report from any completed scan."
        action={
          <Button variant="primary" icon={<IconPlus />} onClick={() => setDialogOpen(true)}>
            Generate report
          </Button>
        }
      />
    )
  else
    body = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <caption className="sr-only">Generated reports</caption>
          <thead>
            <tr className="border-b border-wire">
              {['Report', 'Target', 'Scan', 'Findings', 'Created (UTC)', ''].map((h, i) => (
                <th key={h || i} scope="col" className="label px-4 py-2.5">
                  {h || <span className="sr-only">Download</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.data.map((r) => {
              const scan = scanById.get(r.scanId)
              return (
                <tr key={r.id} className="border-b border-wire hover:bg-panel-2">
                  <td className="px-4 py-3 font-mono text-[12.5px] text-bone">
                    {r.id}
                    <span className="ml-2 rounded-xs border border-wire-2 px-1 text-[10px] text-ash uppercase">
                      {r.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-bone">{r.target}</td>
                  <td className="px-4 py-3 font-mono text-[12.5px]">
                    <Link
                      to={`/findings?scan=${r.scanId}`}
                      className="text-ash hover:text-bone hover:underline"
                    >
                      {r.scanId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {scan ? (
                      <SeverityStrip counts={scan.findingsCount} />
                    ) : (
                      <span className="font-mono text-[12px] text-ash">{r.findings}</span>
                    )}
                  </td>
                  <td className="tabular px-4 py-3 font-mono text-[12px] text-ash">
                    {formatUtc(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      icon={<IconDownload />}
                      onClick={() => download(r)}
                      aria-label={`Download ${r.id} as PDF`}
                    >
                      PDF
                    </Button>
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
        title="Reports"
        meta={
          reports.data
            ? `${reports.data.length} generated`
            : reports.isError
              ? 'could not load reports'
              : 'loading reports'
        }
        actions={
          <Button variant="primary" icon={<IconPlus />} onClick={() => setDialogOpen(true)}>
            Generate report
          </Button>
        }
      />
      <Panel label="Reports">{body}</Panel>
      <p className="font-mono text-[11.5px] text-smoke">
        The reports endpoint is set to fail on its first request after every page load, to show error
        handling. Retry recovers it.
      </p>
      <GenerateReportDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
