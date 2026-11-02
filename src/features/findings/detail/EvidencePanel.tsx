import { useMemo, useState } from 'react'
import { IconCopy } from '@/components/ui/Icons'
import { cn } from '@/lib/cn'
import { toast } from '@/stores/toast'
import type { Evidence } from '@/types/domain'
import { redact, segmentLine, type Segment } from './evidence'

function renderSegment(seg: Segment, i: number, reveal: boolean) {
  switch (seg.kind) {
    case 'payload':
      return (
        <mark key={i} className="rounded-xs bg-signal/15 px-0.5 text-signal ring-1 ring-signal/70">
          {seg.text}
        </mark>
      )
    case 'leak':
      return (
        <mark
          key={i}
          className="bg-transparent text-sev-high underline decoration-sev-high/70 decoration-wavy underline-offset-4"
        >
          {seg.text}
        </mark>
      )
    case 'secret':
      return reveal ? (
        <span key={i} className="text-sev-medium">
          {seg.text}
        </span>
      ) : (
        <span key={i} className="text-smoke" title="Redacted. Use Reveal secrets to show.">
          {redact(seg.text)}
        </span>
      )
    case 'header':
      return (
        <span key={i} className="text-ash">
          {seg.text}
        </span>
      )
    default:
      return <span key={i}>{seg.text}</span>
  }
}

function Pane({
  title,
  raw,
  side,
  reveal,
}: {
  title: string
  raw: string
  side: 'request' | 'response'
  reveal: boolean
}) {
  const lines = useMemo(() => raw.split('\n').map((line) => segmentLine(line, side)), [raw, side])

  async function copy() {
    const visible = reveal
      ? raw
      : lines
          .map((segs) => segs.map((s) => (s.kind === 'secret' ? redact(s.text) : s.text)).join(''))
          .join('\n')
    try {
      await navigator.clipboard.writeText(visible)
      toast.success(`${title} copied`, reveal ? 'Includes secrets.' : 'Secrets stayed redacted.')
    } catch {
      toast.error(
        'Copy failed',
        'Your browser blocked clipboard access. Select the text and copy it manually.',
      )
    }
  }

  return (
    <div className="flex min-w-0 flex-col bg-void">
      <div className="flex items-center justify-between gap-2 border-b border-wire bg-panel px-3 py-1.5">
        <span className="label">{title}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-xs px-1.5 py-0.5 font-mono text-[11px] text-ash hover:bg-panel-2 hover:text-bone"
          aria-label={`Copy ${title.toLowerCase()}`}
        >
          <IconCopy /> copy
        </button>
      </div>
      <pre
        // Scrollable regions must be keyboard-focusable so keyboard users can scroll them (WCAG 2.1.1).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={`Raw HTTP ${side}`}
        className="min-h-0 overflow-x-auto py-2.5 font-mono text-[12.5px] leading-[1.65] text-bone"
      >
        <code>
          {lines.map((segs, n) => (
            <span key={n} className="flex">
              <span aria-hidden className="w-9 shrink-0 pr-3 text-right text-smoke select-none">
                {n + 1}
              </span>
              <span className="pr-4 whitespace-pre">
                {segs.length ? segs.map((s, i) => renderSegment(s, i, reveal)) : ' '}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

/** Raw request and response side by side, like a Burp Repeater tab. Stacks vertically on narrow screens. */
export function EvidencePanel({ evidence }: { evidence: Evidence }) {
  const [reveal, setReveal] = useState(false)
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ash">
          <span>
            <mark className="rounded-xs bg-signal/15 px-1 text-signal ring-1 ring-signal/70">payload</mark>{' '}
            attacker input
          </span>
          <span>
            <mark className="bg-transparent text-sev-high underline decoration-wavy underline-offset-4">
              impact
            </mark>{' '}
            proof in response
          </span>
          <span>
            <span className="text-smoke">████</span> redacted secret
          </span>
        </p>
        <button
          type="button"
          aria-pressed={reveal}
          onClick={() => setReveal((r) => !r)}
          className={cn(
            'rounded-xs border px-2 py-0.5 font-mono text-[11px]',
            reveal ? 'border-sev-medium text-sev-medium' : 'border-wire text-ash hover:text-bone',
          )}
        >
          {reveal ? 'Hide secrets' : 'Reveal secrets'}
        </button>
      </div>
      <div className="grid gap-px overflow-hidden rounded-sm border border-wire bg-wire lg:grid-cols-2">
        <Pane title="Request" raw={evidence.request} side="request" reveal={reveal} />
        <Pane title="Response" raw={evidence.response} side="response" reveal={reveal} />
      </div>
    </div>
  )
}
