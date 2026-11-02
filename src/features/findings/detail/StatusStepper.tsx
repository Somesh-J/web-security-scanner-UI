import { useEffect, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import { STATUS_LABEL } from '@/lib/labels'
import { FINDING_STATUSES, type FindingStatus } from '@/types/domain'

const HINT: Record<FindingStatus, string> = {
  open: 'Reported by the scanner, not yet reviewed',
  confirmed: 'Reproduced by an analyst',
  resolved: 'Fixed and verified',
  false_positive: 'Not a real issue',
}

/**
 * The triage state machine, drawn as a path: open -> confirmed -> resolved | false positive.
 * Implemented as an ARIA radio group: arrow keys move, and the number keys 1 to 4 jump straight to a state.
 */
export function StatusStepper({
  status,
  onChange,
  disabled,
  hotkeys = true,
}: {
  status: FindingStatus
  onChange: (status: FindingStatus) => void
  disabled?: boolean
  hotkeys?: boolean
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const currentIndex = FINDING_STATUSES.indexOf(status)

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

  const step = (s: FindingStatus, i: number) => {
    const checked = s === status
    const passed = (s === 'open' && currentIndex > 0) || (s === 'confirmed' && currentIndex > 1)
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
        title={HINT[s]}
        onClick={() => !checked && onChange(s)}
        onKeyDown={(e) => onKeyDown(e, i)}
        className={cn(
          'flex h-8 items-center gap-2 border px-2.5 font-mono text-[12px] transition-colors duration-150 disabled:cursor-wait',
          checked
            ? s === 'resolved'
              ? 'border-clear bg-clear/15 text-clear'
              : s === 'false_positive'
                ? 'border-ash bg-panel-2 text-bone'
                : 'border-signal bg-signal/15 text-bone'
            : passed
              ? 'border-wire-2 text-bone hover:bg-panel-2'
              : 'border-wire text-ash hover:border-wire-2 hover:text-bone',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-flex size-4 items-center justify-center rounded-full border text-[9px]',
            checked ? 'border-current bg-current' : passed ? 'border-bone' : 'border-smoke',
          )}
        >
          {checked ? <span className="text-void">●</span> : passed ? '✓' : i + 1}
        </span>
        {STATUS_LABEL[s]}
      </button>
    )
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Finding status" className="flex flex-wrap items-center gap-y-2">
        {step('open', 0)}
        <span aria-hidden className="h-px w-4 bg-wire-2" />
        {step('confirmed', 1)}
        <span aria-hidden className="h-px w-4 bg-wire-2" />
        <span className="flex flex-col gap-1">
          {step('resolved', 2)}
          {step('false_positive', 3)}
        </span>
      </div>
      <p className="mt-2 font-mono text-[11px] text-smoke">
        {HINT[status]}. {hotkeys ? 'Keys 1–4 set the status.' : ''}
      </p>
    </div>
  )
}
