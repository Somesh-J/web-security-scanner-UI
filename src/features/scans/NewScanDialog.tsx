import { CircleAlert, Globe, Lock, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '@/api/client'
import { useCreateScan, useScans, useTargets } from '@/api/queries'
import { EnvBadge } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/format'

interface NewScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTargetId?: string
}

/** Picks a website and starts a scan. Websites with a scan already in progress can't be picked twice. */
export function NewScanDialog({ open, onOpenChange, initialTargetId }: NewScanDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Start a new scan"
      description="Pick a website. The scan runs in the background, so you can keep working."
    >
      {/* Mounted only while open, so its state starts fresh on every open. */}
      {open && <NewScanForm initialTargetId={initialTargetId} onDone={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function NewScanForm({ initialTargetId, onDone }: { initialTargetId?: string; onDone: () => void }) {
  const { data: targets = [], isPending } = useTargets()
  const { data: scans = [] } = useScans()
  const createScan = useCreateScan()
  const navigate = useNavigate()
  const [targetId, setTargetId] = useState(initialTargetId ?? '')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const busy = useMemo(
    () =>
      new Set(scans.filter((s) => s.status === 'running' || s.status === 'queued').map((s) => s.targetId)),
    [scans],
  )
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return targets.filter((t) => !q || `${t.name} ${t.url}`.toLowerCase().includes(q))
  }, [targets, search])

  function launch() {
    if (!targetId) {
      setError('Choose a website to scan.')
      return
    }
    if (busy.has(targetId)) {
      setError('A scan is already running for this website.')
      return
    }
    createScan.mutate(targetId, {
      onSuccess: () => {
        onDone()
        navigate('/scans')
      },
      onError: (e) => setError(errorMessage(e)),
    })
  }

  return (
    <>
      <DialogBody>
        <form
          id="new-scan-form"
          onSubmit={(e) => {
            e.preventDefault()
            launch()
          }}
          className="flex flex-col gap-3 pb-4"
        >
          {targets.length > 5 && (
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
              />
              <label htmlFor="scan-site-search" className="sr-only">
                Search websites
              </label>
              <input
                id="scan-site-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search websites"
                className="h-9 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[14px] text-ink placeholder:text-ink-3 focus:border-brand focus:ring-3 focus:ring-brand/20 focus:outline-none"
              />
            </div>
          )}

          {isPending ? (
            <div className="flex flex-col gap-2" role="status" aria-label="Loading websites">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : targets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-8 text-center">
              <Globe aria-hidden className="size-6 text-ink-3" />
              <p className="text-[14px] font-medium text-ink">You haven&rsquo;t added any websites yet</p>
              <Link
                to="/targets?add=1"
                onClick={onDone}
                className="text-[14px] font-medium text-brand-text hover:underline"
              >
                Add your first website
              </Link>
            </div>
          ) : (
            <fieldset>
              <legend className="sr-only">Website to scan</legend>
              <div className="flex max-h-[46vh] flex-col gap-2 overflow-y-auto pr-0.5">
                {shown.length === 0 && (
                  <p className="py-6 text-center text-[14px] text-ink-3">No websites match “{search}”.</p>
                )}
                {shown.map((t) => {
                  const checked = targetId === t.id
                  const isBusy = busy.has(t.id)
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        'flex items-start gap-3 rounded-md border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand/30',
                        isBusy
                          ? 'cursor-not-allowed border-line bg-surface-2/60 opacity-70'
                          : checked
                            ? 'cursor-pointer border-brand bg-brand-soft'
                            : 'cursor-pointer border-line-strong bg-surface hover:bg-surface-2',
                      )}
                    >
                      <input
                        type="radio"
                        name="scan-target"
                        value={t.id}
                        checked={checked}
                        disabled={isBusy}
                        onChange={() => {
                          setTargetId(t.id)
                          setError(null)
                        }}
                        className="mt-1 size-4 shrink-0 accent-[var(--brand)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-ink">{t.name}</span>
                          <EnvBadge environment={t.environment} />
                        </span>
                        <span className="mt-0.5 flex min-w-0 items-center gap-2 text-[13px] text-ink-3">
                          <span className="truncate">{t.url}</span>
                          {t.authenticated && (
                            <span className="inline-flex shrink-0 items-center gap-1">
                              <Lock aria-hidden className="size-3" />
                              Login
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-ink-3">
                          {isBusy
                            ? 'A scan is already running for this website'
                            : t.lastScannedAt
                              ? `Last scanned ${formatRelative(t.lastScannedAt)}`
                              : 'Never scanned'}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="flex items-start gap-1.5 text-[13px] text-danger">
              <CircleAlert aria-hidden className="mt-[3px] size-3.5 shrink-0" />
              {error}
            </p>
          )}
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          form="new-scan-form"
          loading={createScan.isPending}
          disabled={targets.length === 0}
        >
          Start scan
        </Button>
      </DialogFooter>
    </>
  )
}
