import { ChevronDown, CircleCheck, ExternalLink } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSetFindingStatus } from '@/api/queries'
import { EnvBadge, SeverityBadge } from '@/components/ui/Badges'
import { Card } from '@/components/ui/PageHeader'
import { HelpPopover } from '@/components/ui/Help'
import { cn } from '@/lib/cn'
import { formatRelative, formatUtc } from '@/lib/format'
import { categoryCode, categoryName, JARGON, STATUS_LABEL } from '@/lib/labels'
import { toast } from '@/stores/toast'
import type { Finding, FindingStatus, Target } from '@/types/domain'
import { EvidencePanel } from './EvidencePanel'
import { StatusStepper } from './StatusStepper'

function cweUrl(cwe: string) {
  return `https://cwe.mitre.org/data/definitions/${cwe.replace('CWE-', '')}.html`
}

/** "Use parameterised queries. Validate and encode input." -> two checklist steps. */
function steps(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function Section({
  n,
  title,
  children,
  aside,
}: {
  n: number
  title: string
  children: ReactNode
  aside?: ReactNode
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span
          aria-hidden
          className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[12.5px] font-semibold text-brand-text"
        >
          {n}
        </span>
        <h2 id={id} className="text-[17px] leading-6 font-semibold text-ink">
          {title}
        </h2>
        {aside}
      </div>
      <div className="sm:pl-9">{children}</div>
    </section>
  )
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
      <dt className="text-[12.5px] text-ink-3">{label}</dt>
      <dd className="min-w-0 text-[14px] break-words text-ink">{children}</dd>
    </div>
  )
}

/** Proof is optional reading: the explanation is always visible, the raw HTTP opens on request. */
function ProofSection({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <Section n={2} title="Proof">
      <p className="max-w-[68ch] text-[14px] leading-relaxed text-ink-2">{JARGON.evidence}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md text-[14px] font-medium text-brand-text hover:underline"
      >
        <ChevronDown aria-hidden className={cn('size-4 transition-transform', open && 'rotate-180')} />
        {open ? 'Hide technical proof' : 'Show technical proof'}
      </button>
      <div id={panelId} hidden={!open} className="mt-3">
        {open && <EvidencePanel evidence={finding.evidence} />}
      </div>
    </Section>
  )
}

/**
 * One issue, laid out to answer a beginner's questions in order: what's wrong, proof, how to fix.
 * Shared by the side panel and the full page so both always show the same thing.
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
    const previous = finding.status
    setStatus.mutate(
      { ids: [finding.id], status },
      {
        onSuccess: () =>
          toast.success(`Marked as ${STATUS_LABEL[status]}`, finding.title, {
            label: 'Undo',
            onClick: () => setStatus.mutate({ ids: [finding.id], status: previous }),
          }),
      },
    )
  }

  const code = categoryCode(finding.category)
  const details = (
    <Card title="Details" bodyClassName="px-5 pb-5">
      <dl className="divide-y divide-line">
        <MetaRow label="Website">
          {target ? (
            <span className="flex flex-wrap items-center gap-2">
              <Link to={`/findings?target=${target.id}`} className="font-medium hover:underline">
                {target.name}
              </Link>
              <EnvBadge environment={target.environment} />
            </span>
          ) : (
            <span className="text-ink-3">This website was removed</span>
          )}
        </MetaRow>
        {target && (
          <MetaRow label="Address">
            <span className="font-mono text-[13px]">{target.url}</span>
          </MetaRow>
        )}
        <MetaRow label="Where on the site">
          <span className="font-mono text-[13px]">{finding.location}</span>
        </MetaRow>
        <MetaRow label="Found by scan">
          <Link to={`/findings?scan=${finding.scanId}`} className="font-mono text-[13px] hover:underline">
            {finding.scanId}
          </Link>
        </MetaRow>
        <MetaRow label="Found">
          {formatRelative(finding.discoveredAt)}
          <span className="block text-[12.5px] text-ink-3">{formatUtc(finding.discoveredAt)}</span>
        </MetaRow>
        <MetaRow label="Weakness type">
          <a
            href={cweUrl(finding.cwe)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[13px] text-brand-text hover:underline"
          >
            {finding.cwe}
            <ExternalLink aria-hidden className="size-3.5" />
            <span className="sr-only">(opens MITRE CWE in a new tab)</span>
          </a>
        </MetaRow>
      </dl>
    </Card>
  )

  return (
    <article className="flex flex-col gap-8" aria-labelledby={`title-${finding.id}`}>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13.5px] text-ink-2">
          <SeverityBadge severity={finding.severity} size="lg" />
          <span className="inline-flex items-center gap-1">
            <Link to={`/findings?cat=${code}`} className="font-medium text-ink hover:underline">
              {categoryName(finding.category)}
            </Link>
            <span className="text-ink-3">· {code}</span>
            <HelpPopover label="What is OWASP?">{JARGON.owasp}</HelpPopover>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-[13px]">{finding.cwe}</span>
            <HelpPopover label="What is CWE?">{JARGON.cwe}</HelpPopover>
            <a
              href={cweUrl(finding.cwe)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-brand-text hover:underline"
            >
              Learn more
              <ExternalLink aria-hidden className="size-3.5" />
              <span className="sr-only">(opens MITRE CWE in a new tab)</span>
            </a>
          </span>
        </div>
        <h1
          id={`title-${finding.id}`}
          className={cn(
            'font-semibold tracking-[-0.02em] text-ink',
            variant === 'page'
              ? 'text-[28px] leading-9 sm:text-[32px] sm:leading-10'
              : 'text-[24px] leading-8',
          )}
        >
          {finding.title}
        </h1>
        <p className="text-[14px] text-ink-2">
          Found on <span className="font-medium text-ink">{target?.name ?? 'a removed website'}</span>
          {' · '}
          <span className="font-mono text-[13px]">{finding.location}</span>
          {' · '}
          {formatRelative(finding.discoveredAt)} by scan{' '}
          <span className="font-mono text-[13px]">{finding.scanId}</span>
        </p>
      </header>

      <Card title="Status" description="Keep track of where this issue is." bodyClassName="px-5 pb-5">
        <StatusStepper
          status={finding.status}
          onChange={changeStatus}
          disabled={setStatus.isPending}
          hotkeys={variant === 'drawer'}
        />
      </Card>

      <div className={cn('grid gap-8', variant === 'page' && 'lg:grid-cols-[minmax(0,1fr)_300px]')}>
        <div className="flex min-w-0 flex-col gap-8">
          <Section n={1} title="What's wrong">
            <p className="max-w-[68ch] text-[16px] leading-[1.65] text-ink">{finding.description}</p>
          </Section>

          <ProofSection finding={finding} />

          <Section n={3} title="How to fix">
            <ul className="flex max-w-[68ch] flex-col gap-2.5">
              {steps(finding.remediation).map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink">
                  <CircleCheck aria-hidden className="mt-1 size-[18px] shrink-0 text-success" />
                  {s}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <aside aria-label="Issue details" className="min-w-0">
          {details}
        </aside>
      </div>
    </article>
  )
}
