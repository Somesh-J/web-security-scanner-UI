import { Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, IconButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { usePrefsStore } from '@/stores/prefs'
import { useUiStore } from '@/stores/ui'
import type { ChecklistStepId } from './stats'

interface Step {
  id: ChecklistStepId
  title: string
  action: string
}

/** The brief's workflow, in order. The order matters: each step needs the one before it. */
const STEPS: Step[] = [
  { id: 'website', title: 'Add a website', action: 'Add website' },
  { id: 'scan', title: 'Run a scan', action: 'Run a scan' },
  { id: 'review', title: 'Review an issue', action: 'Review issues' },
  { id: 'report', title: 'Create a report', action: 'Create report' },
]

/**
 * Setup steps for new users, ticked automatically from real data.
 * Shown only while something is left to do; once every step is done it disappears, so the Overview
 * gives its space back to the security picture. Closing it hides it for good (remembered in prefs).
 */
export function GetStartedChecklist({ done }: { done: Record<ChecklistStepId, boolean> }) {
  const dismissed = usePrefsStore((s) => s.checklistDismissed)
  const setDismissed = usePrefsStore((s) => s.setChecklistDismissed)
  const openNewScan = useUiStore((s) => s.openNewScan)
  const navigate = useNavigate()

  const count = STEPS.filter((s) => done[s.id]).length
  if (dismissed || count === STEPS.length) return null

  const run: Record<ChecklistStepId, () => void> = {
    website: () => navigate('/targets?add=1'),
    scan: () => openNewScan(),
    review: () => navigate('/findings?status=open'),
    report: () => navigate('/reports?create=1'),
  }
  const next = STEPS.find((s) => !done[s.id])

  return (
    <section aria-labelledby="setup-title" className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 id="setup-title" className="text-[15px] font-semibold text-ink">
          Set up Clearsite
          <span className="ml-2 text-[13px] font-normal text-ink-3">
            {count} of {STEPS.length} done
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {next && (
            <Button size="sm" variant="primary" onClick={run[next.id]}>
              {next.action}
            </Button>
          )}
          <IconButton label="Hide setup steps" size="sm" onClick={() => setDismissed(true)}>
            <X aria-hidden />
          </IconButton>
        </div>
      </div>
      <ol className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
        {STEPS.map((step, i) => {
          const isDone = done[step.id]
          const isNext = step.id === next?.id
          return (
            <li key={step.id} className="flex items-center gap-3 bg-surface px-5 py-3.5">
              <span
                aria-hidden
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold',
                  isDone
                    ? 'bg-brand text-brand-ink'
                    : isNext
                      ? 'border-2 border-brand text-brand-text'
                      : 'border border-line-strong text-ink-3',
                )}
              >
                {isDone ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-[14px]',
                  isDone ? 'text-ink-3' : isNext ? 'font-medium text-ink' : 'text-ink-2',
                )}
              >
                {step.title}
                <span className="sr-only">{isDone ? ' (done)' : ' (to do)'}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
