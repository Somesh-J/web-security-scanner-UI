import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { errorMessage } from '@/api/client'
import { useCreateTarget, useUpdateTarget } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { SelectField, Switch, TextField } from '@/components/ui/Field'
import { ENV_LABEL } from '@/lib/labels'
import { targetFormSchema, type TargetFormValues } from '@/lib/schemas'
import { ENVIRONMENTS, type Target, type TargetInput } from '@/types/domain'

interface TargetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this target; otherwise it creates a new one. */
  target?: Target | null
}

const EMPTY: TargetFormValues = {
  name: '',
  url: '',
  environment: 'staging',
  authenticated: false,
  username: '',
  password: '',
}

/** Add and edit share one validated form. Credentials are only sent when "authenticated scan" is on. */
export function TargetFormDialog({ open, onOpenChange, target }: TargetFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={target ? `targets/${target.id}/edit` : 'targets/new'}
      title={target ? `Edit ${target.name}` : 'Add target'}
      description="A website or API you have written permission to test."
    >
      {/* Mounted only while open: the form initialises from `target` each time, with no reset effect. */}
      <TargetForm target={target ?? null} onDone={() => onOpenChange(false)} />
    </Dialog>
  )
}

function TargetForm({ target, onDone }: { target: Target | null; onDone: () => void }) {
  const mode = target ? 'edit' : 'create'
  const schema = useMemo(() => targetFormSchema(mode), [mode])
  const create = useCreateTarget()
  const update = useUpdateTarget()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TargetFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: target
      ? {
          name: target.name,
          url: target.url,
          environment: target.environment,
          authenticated: target.authenticated,
          username: '',
          password: '',
        }
      : EMPTY,
  })
  const authenticated = useWatch({ control, name: 'authenticated' })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    const input: TargetInput = {
      name: values.name,
      url: values.url,
      environment: values.environment,
      authenticated: values.authenticated,
      ...(values.authenticated && values.username
        ? { credentials: { username: values.username, password: values.password } }
        : {}),
    }
    try {
      if (target) await update.mutateAsync({ id: target.id, input })
      else await create.mutateAsync(input)
      onDone()
    } catch (e) {
      setServerError(errorMessage(e))
    }
  })

  const pending = isSubmitting || create.isPending || update.isPending

  return (
    <>
      <DialogBody>
        <form id="target-form" noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          <TextField
            label="Display name"
            placeholder="Acme Store"
            autoComplete="off"
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="URL"
            type="url"
            inputMode="url"
            placeholder="https://shop.example.com"
            autoComplete="off"
            spellCheck={false}
            error={errors.url?.message}
            hint="The scanner starts crawling from this address."
            {...register('url')}
          />
          <SelectField
            label="Environment"
            error={errors.environment?.message}
            options={ENVIRONMENTS.map((e) => ({ value: e, label: ENV_LABEL[e] }))}
            {...register('environment')}
          />

          <div className="rounded-xs border border-wire px-3 py-3">
            <Switch
              label="Authenticated scan"
              description="Log in first so the scanner can test pages behind the login."
              checked={authenticated}
              onCheckedChange={(on) => setValue('authenticated', on, { shouldDirty: true })}
            />
            {/* Height transition on reveal. Fields unmount when off, so they are neither validated nor sent. */}
            <div
              className="grid transition-[grid-template-rows] duration-150 ease-out"
              style={{ gridTemplateRows: authenticated ? '1fr' : '0fr' }}
            >
              <div className="min-h-0 overflow-hidden">
                {authenticated && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Username"
                      autoComplete="off"
                      placeholder="scanner-account"
                      error={errors.username?.message}
                      {...register('username')}
                    />
                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={target?.authenticated ? 'leave blank to keep' : '••••••••'}
                      error={errors.password?.message}
                      hint={
                        target?.authenticated
                          ? 'Blank keeps the stored password.'
                          : 'Stored encrypted. Never shown again.'
                      }
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="rounded-xs px-1.5 py-0.5 font-mono text-[10.5px] text-ash hover:text-bone"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'hide' : 'show'}
                        </button>
                      }
                      {...register('password')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {serverError && (
            <p
              role="alert"
              className="rounded-xs border border-signal/50 bg-signal/10 px-3 py-2 font-mono text-[12px] text-signal"
            >
              ! {serverError}
            </p>
          )}
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="target-form" loading={pending}>
          {target ? 'Save changes' : 'Add target'}
        </Button>
      </DialogFooter>
    </>
  )
}
