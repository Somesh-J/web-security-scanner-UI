import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { errorMessage } from '@/api/client'
import { useCreateTarget, useUpdateTarget } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Switch, TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { ENV_HELP, ENV_LABEL } from '@/lib/labels'
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

/** Add and edit share one validated form. Credentials are only sent when "needs a login" is on. */
export function TargetFormDialog({ open, onOpenChange, target }: TargetFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={target ? `Edit ${target.name}` : 'Add a website'}
      description="Tell us which site or API to scan. You can change this later."
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
  const environment = useWatch({ control, name: 'environment' })

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
        <form
          id="target-form"
          noValidate
          onSubmit={(e) => void onSubmit(e)}
          className="flex flex-col gap-5 pb-4"
        >
          <TextField
            label="Display name"
            placeholder="Acme Store"
            autoComplete="off"
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="Website address"
            type="url"
            inputMode="url"
            placeholder="https://shop.example.com"
            autoComplete="off"
            spellCheck={false}
            error={errors.url?.message}
            hint="The full address, starting with https://. The scan starts from this page."
            {...register('url')}
          />
          <fieldset>
            <legend className="text-[13px] font-medium text-ink">Environment</legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
              {ENVIRONMENTS.map((env) => {
                const checked = environment === env
                return (
                  <label
                    key={env}
                    className={cn(
                      'flex cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand/30',
                      checked
                        ? 'border-brand bg-brand-soft'
                        : 'border-line-strong bg-surface hover:bg-surface-2',
                    )}
                  >
                    <input
                      type="radio"
                      name="environment"
                      value={env}
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setValue('environment', env, { shouldDirty: true, shouldValidate: true })
                      }
                    />
                    <span className={cn('text-[14px] font-medium', checked ? 'text-brand-text' : 'text-ink')}>
                      {ENV_LABEL[env]}
                    </span>
                    <span className="text-[12.5px] leading-snug text-ink-3">{ENV_HELP[env]}</span>
                  </label>
                )
              })}
            </div>
            {errors.environment?.message && (
              <p role="alert" className="mt-1.5 text-[13px] text-danger">
                {errors.environment.message}
              </p>
            )}
          </fieldset>

          <div className="rounded-lg border border-line bg-surface-2/50 px-4 py-3.5">
            <Switch
              label="This site needs a login to scan"
              description="Turn on if important pages are behind a sign-in. Clearsite will log in first, then scan."
              checked={authenticated}
              onCheckedChange={(on) => setValue('authenticated', on, { shouldDirty: true })}
            />
            {/* Height transition on reveal. Fields unmount when off, so they are neither validated nor sent. */}
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
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
                      placeholder={target?.authenticated ? 'Leave blank to keep' : '••••••••'}
                      error={errors.password?.message}
                      hint={
                        target?.authenticated
                          ? 'Blank keeps the stored password.'
                          : 'Stored securely and never shown again.'
                      }
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="inline-flex size-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff aria-hidden className="size-4" />
                          ) : (
                            <Eye aria-hidden className="size-4" />
                          )}
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
              className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-[13px] text-danger"
            >
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {serverError}
            </p>
          )}

          <p className="flex items-start gap-2 text-[13px] text-ink-3">
            <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
            Only add sites you own or have permission to test.
          </p>
        </form>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" form="target-form" loading={pending}>
          {target ? 'Save changes' : 'Add website'}
        </Button>
      </DialogFooter>
    </>
  )
}
