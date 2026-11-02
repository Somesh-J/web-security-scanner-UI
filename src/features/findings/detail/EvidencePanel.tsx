import { Copy, Eye, EyeOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { toast } from '@/stores/toast'
import type { Evidence } from '@/types/domain'
import { redact, segmentLine, type Segment } from './evidence'

/**
 * The code panel is dark in both themes: it separates raw technical data from the friendly text around
 * it. Highlight colours are fixed hex values tuned for that dark background (all >= 4.5:1 on #18181b).
 */
function renderSegment(seg: Segment, i: number, reveal: boolean) {
  switch (seg.kind) {
    case 'payload':
      return (
        <mark key={i} className="rounded-sm bg-[#4f46e5]/35 px-0.5 text-[#c7caff] ring-1 ring-[#8b93ff]/70">
          {seg.text}
        </mark>
      )
    case 'leak':
      return (
        <mark
          key={i}
          className="bg-transparent text-[#fec84b] underline decoration-[#fec84b]/70 decoration-wavy underline-offset-4"
        >
          {seg.text}
        </mark>
      )
    case 'secret':
      return reveal ? (
        <span key={i} className="text-[#fde272]">
          {seg.text}
        </span>
      ) : (
        <span key={i} className="text-code-dim" title="Hidden. Use Show secrets to reveal.">
          {redact(seg.text)}
        </span>
      )
    case 'header':
      return (
        <span key={i} className="text-code-dim">
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
      toast.success(`${title} copied`, reveal ? 'Includes secrets.' : 'Secrets stayed hidden.')
    } catch {
      toast.error(
        'Copy failed',
        'Your browser blocked clipboard access. Select the text and copy it manually.',
      )
    }
  }

  return (
    <div className="flex min-w-0 flex-col bg-code-bg">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="text-[12.5px] font-medium text-code-ink">
          {title}
          <span className="ml-2 font-normal text-code-dim">
            {side === 'request' ? 'what we sent' : 'what your site answered'}
          </span>
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-code-dim hover:bg-white/10 hover:text-code-ink"
          aria-label={`Copy ${title.toLowerCase()}`}
        >
          <Copy aria-hidden className="size-3.5" /> Copy
        </button>
      </div>
      <pre
        // Scrollable regions must be keyboard-focusable so keyboard users can scroll them (WCAG 2.1.1).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={`Raw HTTP ${side}`}
        className="min-h-0 overflow-x-auto py-3 font-mono text-[13px] leading-[1.65] text-code-ink"
      >
        <code>
          {lines.map((segs, n) => (
            <span key={n} className="flex">
              <span aria-hidden className="w-10 shrink-0 pr-3 text-right text-code-dim/70 select-none">
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

/** Raw request and response side by side on wide screens, stacked on narrow ones. */
export function EvidencePanel({ evidence }: { evidence: Evidence }) {
  const [reveal, setReveal] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm bg-brand ring-1 ring-brand" />
            Test input we sent
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-3 rounded bg-chart-high" />
            Sign of the problem
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="font-mono">
              ••••
            </span>
            Hidden secret
          </span>
        </p>
        <button
          type="button"
          aria-pressed={reveal}
          onClick={() => setReveal((r) => !r)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] font-medium',
            reveal
              ? 'border-sev-high/40 bg-sev-high-soft text-sev-high'
              : 'border-line-strong bg-surface text-ink-2 hover:text-ink',
          )}
        >
          {reveal ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
          {reveal ? 'Hide secrets' : 'Show secrets'}
        </button>
      </div>
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-white/10 lg:grid-cols-2">
        <Pane title="Request" raw={evidence.request} side="request" reveal={reveal} />
        <Pane title="Response" raw={evidence.response} side="response" reveal={reveal} />
      </div>
    </div>
  )
}
