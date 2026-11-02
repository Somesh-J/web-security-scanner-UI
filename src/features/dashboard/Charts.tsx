import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEV_FILL } from '@/components/ui/severityStyles'
import { cn } from '@/lib/cn'
import { SEVERITY_LABEL, SEVERITY_TAG } from '@/lib/labels'
import { SEVERITIES, type Severity } from '@/types/domain'
import { STACK_ORDER, type DayBucket, type SeverityCounts } from './stats'

/**
 * Hand-rolled SVG charts. They read colours from the same CSS variables as the rest of the UI,
 * so they theme automatically, and every mark has a text equivalent (legend, labels, data table).
 */

const SEV_VAR: Record<Severity, string> = {
  critical: 'var(--sev-critical)',
  high: 'var(--sev-high)',
  medium: 'var(--sev-medium)',
  low: 'var(--sev-low)',
  info: 'var(--sev-info)',
}

/** Horizontal stacked bar of open findings by severity. Each segment links to that filtered view. */
export function SeverityBreakdown({ counts }: { counts: SeverityCounts }) {
  const navigate = useNavigate()
  const total = SEVERITIES.reduce((n, s) => n + counts[s], 0)
  const present = SEVERITIES.filter((s) => counts[s] > 0)

  if (total === 0)
    return <p className="py-6 font-mono text-[12.5px] text-ash">$ 0 open findings. Nothing needs action.</p>

  return (
    <div>
      <ul className="flex h-9 w-full gap-[2px]" aria-label="Open findings by severity">
        {present.map((s) => (
          <li key={s} className="flex min-w-2" style={{ flexGrow: counts[s] }}>
            <button
              type="button"
              onClick={() => navigate(`/findings?sev=${s}&status=open,confirmed`)}
              style={{ background: SEV_VAR[s] }}
              className="h-full w-full rounded-[3px] transition-[filter] hover:brightness-125"
              aria-label={`${SEVERITY_LABEL[s]}: ${counts[s]} open. Show these findings.`}
              title={`${SEVERITY_LABEL[s]}: ${counts[s]}`}
            />
          </li>
        ))}
      </ul>
      <ul className="mt-4 grid grid-cols-5 gap-2">
        {SEVERITIES.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => navigate(`/findings?sev=${s}&status=open,confirmed`)}
              className="group w-full rounded-xs text-left"
            >
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-ash group-hover:text-bone">
                <span aria-hidden className={cn('size-2 rounded-[2px]', SEV_FILL[s])} />
                {SEVERITY_TAG[s]}
              </span>
              <span className="tabular mt-1 block font-mono text-[20px] font-medium text-bone">
                {counts[s]}
              </span>
              <span className="sr-only">{SEVERITY_LABEL[s]} open findings. Show these findings.</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Stacked columns of new findings per day by severity, with a hover tooltip and an accessible table. */
export function SeverityTrend({ days }: { days: DayBucket[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = 180
  const pad = { top: 10, right: 8, bottom: 22, left: 26 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  const max = Math.max(4, ...days.map((d) => d.total))
  const niceMax = Math.ceil(max / 4) * 4
  const ticks = [0, niceMax / 4, niceMax / 2, (niceMax * 3) / 4, niceMax]
  const slot = innerW / days.length
  const barW = Math.max(3, slot - 4)
  const y = (v: number) => pad.top + innerH - (v / niceMax) * innerH
  const active = hover !== null ? days[hover] : undefined
  const totalAll = days.reduce((n, d) => n + d.total, 0)

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label={`New findings per day over the last ${days.length} days, ${totalAll} in total. A data table follows.`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--wire)"
              strokeWidth={1}
              strokeDasharray={t === 0 ? undefined : '2 4'}
            />
            <text
              x={pad.left - 8}
              y={y(t) + 3.5}
              textAnchor="end"
              className="fill-smoke font-mono text-[10px]"
            >
              {t}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          let acc = 0
          const x = pad.left + i * slot + (slot - barW) / 2
          return (
            <g key={d.date} opacity={hover === null || hover === i ? 1 : 0.45}>
              {[...STACK_ORDER].map((s) => {
                const v = d.counts[s]
                if (!v) return null
                const y0 = y(acc)
                acc += v
                const y1 = y(acc)
                // 1px surface gap between stacked segments keeps adjacent colours separable.
                return (
                  <rect
                    key={s}
                    x={x}
                    y={y1}
                    width={barW}
                    height={Math.max(1, y0 - y1 - 1)}
                    rx={1.5}
                    fill={SEV_VAR[s]}
                  />
                )
              })}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            </g>
          )
        })}
        {days.map((d, i) =>
          (i % 7 === 0 && days.length - 1 - i >= 4) || i === days.length - 1 ? (
            <text
              key={d.date}
              x={pad.left + i * slot + slot / 2}
              y={H - 6}
              textAnchor="middle"
              className="fill-smoke font-mono text-[10px]"
            >
              {i === days.length - 1 ? 'today' : d.date.slice(5)}
            </text>
          ) : null,
        )}
      </svg>

      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-xs border border-wire-2 bg-panel px-2.5 py-2 font-mono text-[11.5px] shadow-pop"
          style={{ left: `${((pad.left + hover * slot + slot / 2) / W) * 100}%` }}
        >
          <p className="text-bone">
            {active.date} · {active.total} new
          </p>
          {SEVERITIES.filter((s) => active.counts[s]).map((s) => (
            <p key={s} className="flex items-center gap-1.5 text-ash">
              <span aria-hidden className={cn('size-1.5 rounded-[1px]', SEV_FILL[s])} />
              {SEVERITY_TAG[s]} {active.counts[s]}
            </p>
          ))}
        </div>
      )}

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ash" aria-label="Legend">
        {SEVERITIES.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 rounded-[2px]', SEV_FILL[s])} />
            {SEVERITY_LABEL[s]}
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>New findings per day by severity</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {SEVERITIES.map((s) => (
              <th key={s} scope="col">
                {SEVERITY_LABEL[s]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days
            .filter((d) => d.total > 0)
            .map((d) => (
              <tr key={d.date}>
                <th scope="row">{d.date}</th>
                {SEVERITIES.map((s) => (
                  <td key={s}>{d.counts[s]}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
