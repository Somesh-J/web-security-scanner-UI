import { CircleCheck, CircleDot, CircleSlash, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import { STATUS_HELP, STATUS_LABEL } from '@/lib/labels'
import { FINDING_STATUSES, type FindingStatus } from '@/types/domain'

const ICON: Record<FindingStatus, LucideIcon> = {
  open: CircleDot,
  confirmed: TriangleAlert,
  resolved: CircleCheck,
  false_positive: CircleSlash,
}

const SELECTED: Record<FindingStatus, string> = {
  open: 'bg-surface text-brand-text shadow-sm ring-1 ring-line',
  confirmed: 'bg-surface text-sev-high shadow-sm ring-1 ring-line',
  resolved: 'bg-surface text-success shadow-sm ring-1 ring-line',
  false_positive: 'bg-surface text-ink shadow-sm ring-1 ring-line',
}

/**
 * The triage state (New, Confirmed, Fixed, Not an issue) as a segmented control.
 * Implemented as an ARIA radio group: arrow keys move; with `hotkeys`, number keys 1 to 4 jump to a state.
 * The helper text under it explains the selected state in plain words.
 */
export function StatusStepper({
  status,
  onChange,
  disabled,
  hotkeys = false,
}: {
  status: FindingStatus
  onChange: (status: FindingStatus) => void
  disabled?: boolean
  hotkeys?: boolean
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const helpId = useId()

  useEffect(() => {
    if (!hotkeys) return
    function onKey(e: globalThis.KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      const next = FINDING_STATUSES[n - 1]
      if (n >= 1 && n <= 4 && next && next !== status && !disabled) {
        e.preventDefault()
        onChange(next)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotkeys, status, onChange, disabled])

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp')
      return
    e.preventDefault()
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    const next = (index + delta + FINDING_STATUSES.length) % FINDING_STATUSES.length
    refs.current[next]?.focus()
    const s = FINDING_STATUSES[next]
    if (s) onChange(s)
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Issue status"
        aria-describedby={helpId}
        className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1 sm:grid-cols-4"
      >
        {FINDING_STATUSES.map((s, i) => {
          const checked = s === status
          const Icon = ICON[s]
          return (
            <button
              key={s}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              disabled={disabled}
              onClick={() => !checked && onChange(s)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'flex h-9 items-center justify-center gap-2 rounded-md px-3 text-[14px] font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 disabled:cursor-wait',
                checked ? SELECTED[s] : 'text-ink-2 hover:text-ink',
              )}
            >
              <Icon aria-hidden className="size-4" />
              {STATUS_LABEL[s]}
            </button>
          )
        })}
      </div>
      <p id={helpId} className="mt-2 text-[13px] text-ink-2">
        {STATUS_HELP[status]}
        {hotkeys && <span className="hidden text-ink-3 md:inline"> Tip: press 1–4 to change it.</span>}
      </p>
    </div>
  )
}
