import * as RadixDialog from '@radix-ui/react-dialog'
import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams, type Location } from 'react-router-dom'
import { useFinding, useFindings, useTargets } from '@/api/queries'
import { ErrorState } from '@/components/ui/States'
import { Kbd } from '@/components/ui/States'
import { applyQuery } from '../applyQuery'
import { fromSearchParams } from '../query'
import { FindingDetail } from './FindingDetail'
import { DetailSkeleton } from './FindingDetailPage'

/**
 * Inspector drawer over the findings table (the "modal route" pattern): the URL is /findings/:id,
 * the table stays rendered underneath, and [ / ] step through the rows of the current view.
 */
export function FindingDrawer() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const background = (location.state as { background?: Location } | null)?.background
  const finding = useFinding(id)
  const { data: findings = [] } = useFindings()
  const { data: targets = [] } = useTargets()
  const target = targets.find((t) => t.id === finding.data?.targetId)

  const ordered = useMemo(() => {
    const names = new Map(targets.map((t) => [t.id, t.name]))
    return applyQuery(findings, fromSearchParams(new URLSearchParams(background?.search ?? '')), {
      targetNames: names,
    }).matched
  }, [findings, targets, background?.search])
  const index = ordered.findIndex((f) => f.id === id)
  const prev = index > 0 ? ordered[index - 1] : undefined
  const next = index >= 0 ? ordered[index + 1] : undefined

  const close = () => navigate({ pathname: '/findings', search: background?.search ?? '' })
  const go = (to: string) =>
    navigate(
      { pathname: `/findings/${to}`, search: location.search },
      { replace: true, state: { background } },
    )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      if (e.key === ']' && next) go(next.id)
      if (e.key === '[' && prev) go(prev.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <RadixDialog.Root open onOpenChange={(open) => !open && close()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 animate-fade bg-void/60" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[760px] animate-drawer flex-col border-l border-wire-2 bg-panel shadow-pop focus:outline-none"
        >
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-wire px-4">
            <RadixDialog.Title className="font-mono text-[12px] text-ash">
              ~/findings/<span className="text-bone">{id}</span>
            </RadixDialog.Title>
            <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-smoke">
              {index >= 0 && (
                <span className="tabular mr-2">
                  {index + 1}/{ordered.length}
                </span>
              )}
              <button
                type="button"
                disabled={!prev}
                onClick={() => prev && go(prev.id)}
                className="rounded-xs px-1.5 py-0.5 text-ash hover:bg-panel-2 hover:text-bone disabled:opacity-30"
                aria-label="Previous finding"
              >
                <Kbd>[</Kbd> prev
              </button>
              <button
                type="button"
                disabled={!next}
                onClick={() => next && go(next.id)}
                className="rounded-xs px-1.5 py-0.5 text-ash hover:bg-panel-2 hover:text-bone disabled:opacity-30"
                aria-label="Next finding"
              >
                next <Kbd>]</Kbd>
              </button>
              <Link
                to={`/findings/${id}`}
                className="ml-2 rounded-xs px-1.5 py-0.5 text-ash hover:bg-panel-2 hover:text-bone"
                title="Open as a full page"
              >
                full page
              </Link>
              <RadixDialog.Close
                className="ml-1 rounded-xs px-1.5 py-0.5 text-ash hover:bg-panel-2 hover:text-bone"
                aria-label="Close"
              >
                esc
              </RadixDialog.Close>
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
            {finding.data ? (
              <FindingDetail finding={finding.data} target={target} variant="drawer" />
            ) : finding.isError ? (
              <ErrorState
                error={finding.error}
                resource={`/api/findings/${id}`}
                onRetry={() => void finding.refetch()}
              />
            ) : (
              <DetailSkeleton />
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
