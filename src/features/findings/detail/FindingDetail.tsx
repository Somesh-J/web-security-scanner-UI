import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSetFindingStatus } from '@/api/queries'
import { IconExternal } from '@/components/ui/Icons'
import { EnvTag, SeverityTag } from '@/components/ui/Tags'
import { cn } from '@/lib/cn'
import { SEVERITY_LABEL, STATUS_LABEL } from '@/lib/labels'
import { formatUtc } from '@/lib/format'
import { toast } from '@/stores/toast'
import type { Finding, FindingStatus, Target } from '@/types/domain'
import { EvidencePanel } from './EvidencePanel'
import { StatusStepper } from './StatusStepper'

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('min-w-0', className)} aria-label={title}>
      <h2 className="label mb-2.5 flex items-center gap-3">
        {title}
        <span aria-hidden className="h-px flex-1 bg-wire" />
      </h2>
      {children}
    </section>
  )
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3 py-1.5">
      <dt className="label pt-px">{label}</dt>
      <dd className="min-w-0 font-mono text-[12.5px] break-words text-bone">{children}</dd>
    </div>
  )
}

function cweUrl(cwe: string) {
  return `https://cwe.mitre.org/data/definitions/${cwe.replace('CWE-', '')}.html`
}

/**
 * One finding, laid out in the order an analyst works: what it is, where it is, the proof, the fix.
 * Shared by the side drawer and the full page so both always show the same thing.
 */
export function FindingDetail({
  finding,
  target,
  variant,
}: {
  finding: Finding
  target: Target | undefined
  variant: 'page' | 'drawer'
}) {
  const setStatus = useSetFindingStatus()

  function changeStatus(status: FindingStatus) {
    setStatus.mutate(
      { ids: [finding.id], status },
      { onSuccess: () => toast.success(`${finding.id} marked ${STATUS_LABEL[status]}`) },
    )
  }

  return (
    <article className="flex flex-col gap-7" aria-labelledby={`title-${finding.id}`}>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SeverityTag severity={finding.severity} />
          <span className="font-mono text-[12px] text-ash">{finding.id}</span>
        </div>
        <h1
          id={`title-${finding.id}`}
          className={cn(
            'font-display leading-[0.95] tracking-wide text-bone uppercase',
            variant === 'page' ? 'text-[34px] sm:text-[42px]' : 'text-[32px]',
          )}
        >
          {finding.title}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12.5px] text-ash">
          <Link to={`/findings?cat=${finding.category.slice(0, 3)}`} className="text-bone hover:underline">
            {finding.category}
          </Link>
          <span className="text-smoke">·</span>
          <a
            href={cweUrl(finding.cwe)}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-live hover:underline"
          >
            {finding.cwe}
            <IconExternal />
            <span className="sr-only">(opens MITRE CWE in a new tab)</span>
          </a>
          <span className="text-smoke">·</span>
          <span>{SEVERITY_LABEL[finding.severity]} severity</span>
        </p>
        <div className="pt-1">
          <StatusStepper status={finding.status} onChange={changeStatus} disabled={setStatus.isPending} />
        </div>
      </header>

      <div className={cn('grid gap-7', variant === 'page' && 'xl:grid-cols-[minmax(0,1fr)_280px]')}>
        <div className="flex min-w-0 flex-col gap-7">
          <Section title="Description">
            <p className="max-w-[68ch] text-[14px] leading-relaxed text-bone">{finding.description}</p>
          </Section>
          <Section title="Evidence">
            <EvidencePanel evidence={finding.evidence} />
          </Section>
          <Section title="Remediation">
            <div className="max-w-[68ch] border-l-2 border-clear/60 pl-4">
              <p className="text-[14px] leading-relaxed text-bone">{finding.remediation}</p>
            </div>
          </Section>
        </div>

        <aside
          aria-label="Finding details"
          className={cn(variant === 'page' && 'xl:order-none', 'order-first xl:order-last')}
        >
          <Section title="Affected">
            <dl className="divide-y divide-wire rounded-sm border border-wire bg-panel px-3">
              <MetaRow label="Target">
                {target ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <Link to={`/findings?target=${target.id}`} className="hover:underline">
                      {target.name}
                    </Link>
                    <EnvTag environment={target.environment} />
                  </span>
                ) : (
                  <span className="text-ash">{finding.targetId} (removed)</span>
                )}
              </MetaRow>
              {target && <MetaRow label="URL">{target.url}</MetaRow>}
              <MetaRow label="Location">
                <span className="text-sev-medium">{finding.location}</span>
              </MetaRow>
              <MetaRow label="Scan">
                <Link to={`/findings?scan=${finding.scanId}`} className="hover:underline">
                  {finding.scanId}
                </Link>
              </MetaRow>
              <MetaRow label="Found">{formatUtc(finding.discoveredAt)}</MetaRow>
            </dl>
          </Section>
        </aside>
      </div>
    </article>
  )
}
