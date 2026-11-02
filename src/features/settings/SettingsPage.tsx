import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Switch, TextField } from '@/components/ui/Field'
import { IconCopy } from '@/components/ui/Icons'
import { PageHeader, Panel } from '@/components/ui/PageHeader'
import { cn } from '@/lib/cn'
import { FAULT_KEY } from '@/lib/demo'
import { profileSchema, type ProfileValues } from '@/lib/schemas'
import { STORAGE_KEY } from '@/mocks/db'
import { useAuthStore } from '@/stores/auth'
import { usePrefsStore, type ThemeMode } from '@/stores/prefs'
import { toast } from '@/stores/toast'

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  return `rc_live_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

function Row({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 px-4 py-5 md:grid-cols-[240px_minmax(0,1fr)]">
      <div>
        <h3 className="text-[13.5px] font-medium text-bone">{title}</h3>
        {description && <p className="mt-1 text-[12.5px] text-ash">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function ProfileForm() {
  const session = useAuthStore((s) => s.session)
  const updateUser = useAuthStore((s) => s.updateUser)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: session?.user ?? { name: '', email: '', role: '' },
  })

  return (
    <form
      noValidate
      onSubmit={(e) =>
        void handleSubmit((values) => {
          updateUser(values)
          reset(values)
          toast.success('Profile saved')
        })(e)
      }
      className="grid max-w-xl gap-4 sm:grid-cols-2"
    >
      <TextField label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <TextField
        label="Role"
        autoComplete="organization-title"
        error={errors.role?.message}
        {...register('role')}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        fieldClassName="sm:col-span-2"
        {...register('email')}
      />
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="primary" disabled={!isDirty}>
          Save profile
        </Button>
        {isDirty && (
          <Button variant="ghost" onClick={() => reset()}>
            Discard
          </Button>
        )}
      </div>
    </form>
  )
}

const THEMES: { value: ThemeMode; label: string; hint: string }[] = [
  { value: 'dark', label: 'Ops', hint: 'dark, default' },
  { value: 'light', label: 'Dossier', hint: 'light' },
  { value: 'system', label: 'System', hint: 'follow the OS' },
]

function ThemePicker() {
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)
  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <label
            key={t.value}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-xs border px-3 py-2 font-mono text-[12px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-live',
              theme === t.value ? 'border-bone bg-bone text-void' : 'border-wire-2 text-ash hover:text-bone',
            )}
          >
            <input
              type="radio"
              name="theme"
              value={t.value}
              checked={theme === t.value}
              onChange={() => setTheme(t.value)}
              aria-label={`${t.label} theme, ${t.hint}`}
              className="sr-only"
            />
            <span aria-hidden>{theme === t.value ? '(•)' : '( )'}</span>
            <span>
              <span className="block font-semibold tracking-wider uppercase">{t.label}</span>
              <span className="text-[11px] opacity-70">{t.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ApiKeyField() {
  const [key, setKey] = useState('rc_live_7f3a9c21d4e84b0fa61c55e2b9d03f7a1c8e44b2')
  const [revealed, setRevealed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const shown = revealed ? key : `${key.slice(0, 8)}${'•'.repeat(24)}${key.slice(-4)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(key)
      toast.success('API key copied')
    } catch {
      toast.error('Copy failed', 'Your browser blocked clipboard access.')
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <TextField
        label="API key"
        readOnly
        value={shown}
        hint="Placeholder. Use it as a bearer token for the REDCELL API once the backend is connected."
        className="tracking-wide"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setRevealed((r) => !r)} aria-pressed={revealed}>
          {revealed ? 'Hide' : 'Reveal'}
        </Button>
        <Button size="sm" icon={<IconCopy />} onClick={() => void copy()}>
          Copy
        </Button>
        {confirming ? (
          <span className="flex items-center gap-2 font-mono text-[12px] text-ash" role="alert">
            Old key stops working.
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setKey(randomKey())
                setConfirming(false)
                setRevealed(true)
                toast.success('New API key generated', 'Copy it now and update your integrations.')
              }}
            >
              Regenerate
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
            Regenerate…
          </Button>
        )}
      </div>
    </div>
  )
}

function DevTools() {
  const qc = useQueryClient()
  const [fault, setFault] = useState(() => {
    try {
      return localStorage.getItem(FAULT_KEY) === 'on'
    } catch {
      return false
    }
  })

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <Switch
        label="Simulate API outage"
        description="Every data request returns HTTP 500 until you switch this off. Use it to see the error state on each screen."
        checked={fault}
        onCheckedChange={(on) => {
          try {
            if (on) localStorage.setItem(FAULT_KEY, 'on')
            else localStorage.removeItem(FAULT_KEY)
          } catch {
            // Storage blocked: the switch has no effect.
          }
          setFault(on)
          void qc.invalidateQueries()
          toast.info(
            on ? 'Outage simulation on' : 'Outage simulation off',
            on ? 'Visit any screen to see its error state.' : 'Data is loading again.',
          )
        }}
      />
      <div>
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY)
            window.location.reload()
          }}
        >
          Reset demo data
        </Button>
        <p className="mt-1.5 text-[12px] text-ash">
          Restores the original targets, scans and findings, and reloads the app.
        </p>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const crt = usePrefsStore((s) => s.crt)
  const setCrt = usePrefsStore((s) => s.setCrt)

  return (
    <div className="flex flex-col gap-5 px-4 py-6 md:px-6">
      <PageHeader title="Settings" meta="saved in this browser" />

      <Panel label="operator profile">
        <Row title="Profile" description="Shown in the status bar and on reports.">
          <ProfileForm />
        </Row>
      </Panel>

      <Panel label="appearance">
        <Row title="Theme" description="Saved across reloads and applied before the page draws.">
          <ThemePicker />
        </Row>
        <div className="border-t border-dashed border-wire" />
        <Row
          title="CRT mode"
          description="Scanlines and phosphor glow. Purely cosmetic, and off when reduced motion is on."
        >
          <div className="max-w-xl">
            <Switch label="Enable CRT mode" checked={crt} onCheckedChange={setCrt} />
          </div>
        </Row>
      </Panel>

      <Panel label="api access">
        <Row title="API key" description="For CI pipelines and scripts.">
          <ApiKeyField />
        </Row>
      </Panel>

      <Panel label="demo controls">
        <Row
          title="Mock API"
          description="This build runs against a mock backend in your browser (Mock Service Worker)."
        >
          <DevTools />
        </Row>
      </Panel>
    </div>
  )
}
