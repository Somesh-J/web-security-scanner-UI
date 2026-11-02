import * as RadixDialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams, type Location } from 'react-router-dom'
import { useFinding, useFindings, useTargets } from '@/api/queries'
import { IconButton } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/States'
import { applyQuery } from '../applyQuery'
import { fromSearchParams } from '../query'
import { FindingDetail } from './FindingDetail'
import { DetailSkeleton } from './FindingDetailPage'

/**
 * Side panel over the issues table (the "modal route" pattern): the URL is /findings/:id, the table
 * stays rendered underneath, and Prev / Next step through the rows of the current filtered view.
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

  // [ and ] step through issues: a hidden extra for keyboard users; the buttons do the same.
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
        <RadixDialog.Overlay className="fixed inset-0 z-40 animate-fade bg-[var(--overlay)]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] animate-slide flex-col border-l border-line bg-bg shadow-lg focus:outline-none"
        >
          <div className="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-3">
            <RadixDialog.Title className="pl-2 text-[14px] font-medium text-ink">
              Issue details
            </RadixDialog.Title>
            {index >= 0 && (
              <span className="tabular ml-2 text-[13px] text-ink-3">
                {index + 1} of {ordered.length}
              </span>
            )}
            <span className="ml-auto flex items-center gap-0.5">
              <IconButton
                label="Previous issue"
                size="sm"
                disabled={!prev}
                onClick={() => prev && go(prev.id)}
              >
                <ChevronLeft aria-hidden />
              </IconButton>
              <IconButton label="Next issue" size="sm" disabled={!next} onClick={() => next && go(next.id)}>
                <ChevronRight aria-hidden />
              </IconButton>
              <Link
                to={`/findings/${id}`}
                className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                <Maximize2 aria-hidden className="size-3.5" />
                Open full page
              </Link>
              <RadixDialog.Close asChild>
                <IconButton label="Close" size="sm">
                  <X aria-hidden />
                </IconButton>
              </RadixDialog.Close>
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            {finding.data ? (
              <FindingDetail finding={finding.data} target={target} variant="drawer" />
            ) : finding.isError ? (
              <ErrorState
                error={finding.error}
                resource="this issue"
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
