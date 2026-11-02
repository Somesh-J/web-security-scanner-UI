import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEV_CHART_VAR } from '@/components/ui/severityStyles'
import { cn } from '@/lib/cn'
import { SEVERITY_HELP, SEVERITY_LABEL } from '@/lib/labels'
import { SEVERITIES, type Severity } from '@/types/domain'
import { STACK_ORDER, type DayBucket, type SeverityCounts } from './stats'

/**
 * Overview charts, hand-rolled SVG. Colours come from the same CSS variables as the rest of the UI,
 * so both themes work, and every mark has a text equivalent (the legend counts, or a data table).
 */

const RADIUS = 52
const STROKE = 16
const CIRC = 2 * Math.PI * RADIUS

/** Donut of open issues by severity, with the total in the centre and a legend that lists every count. */
export function SeverityDonut({ counts }: { counts: SeverityCounts }) {
  const navigate = useNavigate()
  const [hover, setHover] = useState<Severity | null>(null)
  const total = SEVERITIES.reduce((n, s) => n + counts[s], 0)
  const open = (s: Severity) => navigate(`/findings?sev=${s}&status=open,confirmed`)

  if (total === 0)
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CircleCheck aria-hidden className="size-8 text-success" />
        <p className="text-[15px] font-medium text-ink">No open issues</p>
        <p className="text-[13px] text-ink-2">Nothing needs your attention right now.</p>
      </div>
    )

  // A small gap between slices keeps them readable; skip it when one severity is the whole ring.
  const gap = SEVERITIES.filter((s) => counts[s] > 0).length > 1 ? 2 : 0
  const present = SEVERITIES.filter((s) => counts[s] > 0)
  const slices = present.map((s, i) => {
    // Start of this slice = arc length of every slice before it.
    const offset = present.slice(0, i).reduce((n, p) => n + (counts[p] / total) * CIRC, 0)
    const len = (counts[s] / total) * CIRC
    return { s, len: Math.max(0, len - gap), offset }
  })

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden>
          <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth={STROKE} />
          {slices.map(({ s, len, offset: o }) => (
            <circle
              key={s}
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke={SEV_CHART_VAR[s]}
              strokeWidth={hover === s ? STROKE + 4 : STROKE}
              strokeDasharray={`${len} ${CIRC - len}`}
              strokeDashoffset={-o}
              className="cursor-pointer transition-[stroke-width,opacity] duration-150"
              opacity={hover && hover !== s ? 0.35 : 1}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
              onClick={() => open(s)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="display tabular text-[32px] leading-none font-semibold text-ink">
            {hover ? counts[hover] : total}
          </span>
          <span className="mt-1 text-[12px] text-ink-3">{hover ? SEVERITY_LABEL[hover] : 'open issues'}</span>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-col gap-0.5" aria-label="Open issues by severity">
        {SEVERITIES.map((s) => {
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => open(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(s)}
                onBlur={() => setHover(null)}
                title={SEVERITY_HELP[s]}
                aria-label={`${SEVERITY_LABEL[s]}: ${counts[s]} open. Show these issues.`}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-[14px] transition-colors hover:bg-surface-2',
                  counts[s] === 0 && 'opacity-60',
                )}
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ background: SEV_CHART_VAR[s] }}
                />
                <span className="flex-1 text-ink">{SEVERITY_LABEL[s]}</span>
                <span className="tabular font-semibold text-ink">{counts[s]}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

/** New issues per day for the last 30 days, as stacked columns. Hover or focus a day for its breakdown. */
export function IssuesOverTime({ days }: { days: DayBucket[] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...days.map((d) => d.total))
  const total = days.reduce((n, d) => n + d.total, 0)
  const shown = active !== null ? days[active] : undefined
  const first = days[0]
  const last = days.at(-1)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-11 items-baseline justify-between gap-4">
        {shown ? (
          <div>
            <p className="text-[13px] text-ink-3">{shortDate(shown.date)}</p>
            <p className="text-[14px] text-ink">
              <span className="tabular font-semibold">{shown.total}</span> new issue
              {shown.total === 1 ? '' : 's'}
              {shown.total > 0 && (
                <span className="text-ink-2">
                  {' '}
                  (
                  {SEVERITIES.filter((s) => shown.counts[s] > 0)
                    .map((s) => `${shown.counts[s]} ${SEVERITY_LABEL[s]}`)
                    .join(', ')}
                  )
                </span>
              )}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[13px] text-ink-3">Last 30 days</p>
            <p className="text-[14px] text-ink">
              <span className="tabular font-semibold">{total}</span> new issues found
            </p>
          </div>
        )}
      </div>

      <div
        className="flex h-40 items-end gap-[3px]"
        role="group"
        aria-label="New issues per day. Use Tab to move between days."
        onMouseLeave={() => setActive(null)}
      >
        {days.map((d, i) => (
          <button
            key={d.date}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            aria-label={`${shortDate(d.date)}: ${d.total} new issues`}
            className={cn(
              'group flex h-full min-w-0 flex-1 flex-col-reverse rounded-[3px] focus-visible:outline-offset-1',
              active === i && 'bg-surface-2',
            )}
          >
            {d.total === 0 ? (
              <span aria-hidden className="h-[2px] w-full rounded-full bg-line" />
            ) : (
              [...STACK_ORDER].map((s) =>
                d.counts[s] ? (
                  <span
                    key={s}
                    aria-hidden
                    className="w-full first:rounded-b-[3px] last:rounded-t-[3px]"
                    style={{
                      height: `${(d.counts[s] / max) * 100}%`,
                      background: SEV_CHART_VAR[s],
                      opacity: active === null || active === i ? 1 : 0.45,
                    }}
                  />
                ) : null,
              )
            )}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[12px] text-ink-3" aria-hidden>
        <span>{first && shortDate(first.date)}</span>
        <span>{last && shortDate(last.date)}</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-2" aria-hidden>
        {SEVERITIES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm" style={{ background: SEV_CHART_VAR[s] }} />
            {SEVERITY_LABEL[s]}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>New issues per day, last 30 days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {SEVERITIES.map((s) => (
              <th key={s} scope="col">
                {SEVERITY_LABEL[s]}
              </th>
            ))}
            <th scope="col">Total</th>
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
                <td>{d.total}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
