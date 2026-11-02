import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '@/api/client'
import { useCreateScan, useScans, useTargets } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { SelectField } from '@/components/ui/Field'
import { EnvTag } from '@/components/ui/Tags'
import { ENV_LABEL } from '@/lib/labels'

interface NewScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTargetId?: string
}

/** Picks a target and launches a scan. Targets with a scan already in progress are marked. */
export function NewScanDialog({ open, onOpenChange, initialTargetId }: NewScanDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="scans/new"
      title="Launch scan"
      description="Run an automated web scan against a target you are authorised to test."
    >
      {/* Mounted only while open, so its state starts fresh on every open. */}
      <NewScanForm initialTargetId={initialTargetId} onDone={() => onOpenChange(false)} />
    </Dialog>
  )
}

function NewScanForm({ initialTargetId, onDone }: { initialTargetId?: string; onDone: () => void }) {
  const { data: targets = [], isPending } = useTargets()
  const { data: scans = [] } = useScans()
  const createScan = useCreateScan()
  const navigate = useNavigate()
  const [targetId, setTargetId] = useState(initialTargetId ?? '')
  const [error, setError] = useState<string | null>(null)

  const busy = new Set(
    scans.filter((s) => s.status === 'running' || s.status === 'queued').map((s) => s.targetId),
  )
  const target = targets.find((t) => t.id === targetId)

  function launch() {
    if (!targetId) {
      setError('Choose a target to scan.')
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
          className="flex flex-col gap-4"
        >
          <SelectField
            label="Target"
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value)
              setError(null)
            }}
            placeholder={isPending ? 'Loading targets…' : 'Choose a target'}
            error={error ?? undefined}
            options={targets.map((t) => ({
              value: t.id,
              label: `${t.name} · ${ENV_LABEL[t.environment]}${busy.has(t.id) ? ' · scan in progress' : ''}`,
            }))}
          />
          {target && (
            <div className="rounded-xs border border-wire bg-panel-2 px-3 py-2.5 font-mono text-[12px]">
              <p className="flex flex-wrap items-center gap-2 text-bone">
                {target.url} <EnvTag environment={target.environment} />
              </p>
              <p className="mt-1 text-ash">
                {target.authenticated
                  ? 'Authenticated scan with stored credentials.'
                  : 'Unauthenticated scan.'}{' '}
                {busy.has(target.id) && (
                  <span className="text-sev-high">A scan is already running for this target.</span>
                )}
              </p>
              {target.environment === 'production' && (
                <p className="mt-1 text-signal">Production target. Active tests may create real records.</p>
              )}
            </div>
          )}
          {targets.length === 0 && !isPending && (
            <p className="font-mono text-[12px] text-ash">
              No targets yet. Add one on the Targets screen first.
            </p>
          )}
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="new-scan-form" loading={createScan.isPending}>
          Launch scan
        </Button>
      </DialogFooter>
    </>
  )
}
