import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Info, KeyRound, Monitor, Moon, Palette, RotateCcw, Sun, User, Wrench } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Switch, TextField } from '@/components/ui/Field'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { cn } from '@/lib/cn'
import { FAULT_KEY } from '@/lib/demo'
import { profileSchema, type ProfileValues } from '@/lib/schemas'
import { STORAGE_KEY } from '@/mocks/db'
import { useAuthStore } from '@/stores/auth'
import { usePrefsStore, type ThemeMode } from '@/stores/prefs'
import { toast } from '@/stores/toast'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'api-key', label: 'API key', icon: KeyRound },
  { id: 'demo', label: 'Demo tools', icon: Wrench },
] as const

function Section({
  id,
  title,
  description,
  badge,
  children,
}: {
  id: string
  title: string
  description: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="card scroll-mt-6 p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="text-[16px] leading-6 font-semibold text-ink">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>
        </div>
        {badge}
      </div>
      {children}
    </section>
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
          Save changes
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

const THEMES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Match my system', icon: Monitor },
]

/** A tiny drawing of the app in a given theme, so the choice is visual rather than a word. */
function ThemePreview({ mode }: { mode: ThemeMode }) {
  const light = { bg: '#f7f7f5', card: '#ffffff', line: '#e6e5e1', ink: '#d4d3ce' }
  const dark = { bg: '#0e0e11', card: '#16161a', line: '#2a2a31', ink: '#3a3a42' }
  const pane = (c: typeof light, clip?: string) => (
    <div className="absolute inset-0 flex gap-1.5 p-2" style={{ background: c.bg, clipPath: clip }}>
      <div className="w-1/4 rounded-md" style={{ background: c.card, border: `1px solid ${c.line}` }}>
        <div className="m-1.5 h-1.5 w-3/4 rounded-full bg-[#4f46e5]" />
        <div className="m-1.5 h-1 w-2/3 rounded-full" style={{ background: c.ink }} />
        <div className="m-1.5 h-1 w-1/2 rounded-full" style={{ background: c.ink }} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-1/3 rounded-md" style={{ background: c.card, border: `1px solid ${c.line}` }} />
        <div className="flex-1 rounded-md" style={{ background: c.card, border: `1px solid ${c.line}` }} />
      </div>
    </div>
  )
  return (
    <div aria-hidden className="relative h-20 overflow-hidden rounded-md border border-line">
      {mode === 'dark' ? pane(dark) : pane(light)}
      {mode === 'system' && pane(dark, 'polygon(55% 0, 100% 0, 100% 100%, 45% 100%)')}
    </div>
  )
}

function ThemePicker() {
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)
  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
        {THEMES.map((t) => {
          const selected = theme === t.value
          const Icon = t.icon
          return (
            <label
              key={t.value}
              className={cn(
                'flex cursor-pointer flex-col gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
                selected ? 'border-brand bg-brand-soft' : 'border-line hover:bg-surface-2',
              )}
            >
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={selected}
                onChange={() => setTheme(t.value)}
                className="sr-only"
              />
              <ThemePreview mode={t.value} />
              <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                <Icon aria-hidden className="size-4 text-ink-3" />
                <span className="flex-1">{t.label}</span>
                {selected && <Check aria-hidden className="size-4 text-brand-text" />}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * A placeholder only (the brief asks for an API-key field). It is visibly disabled and says so, with no
 * copy/reveal/regenerate controls, so nobody thinks a working key exists.
 */
function ApiKeyPlaceholder() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <TextField
        label="API key"
        disabled
        readOnly
        value="cs_live_••••••••••••••••"
        hint="Not active. This is a placeholder."
        className="font-mono"
      />
      <p className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2 px-4 py-3 text-[13px] text-ink-2">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3" />
        API access is coming soon. When it&rsquo;s available, you&rsquo;ll be able to create and manage keys
        here.
      </p>
    </div>
  )
}

function DemoTools() {
  const qc = useQueryClient()
  const [confirmReset, setConfirmReset] = useState(false)
  const [fault, setFault] = useState(() => {
    try {
      return localStorage.getItem(FAULT_KEY) === 'on'
    } catch {
      return false
    }
  })

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Switch
        label="Simulate a server outage"
        description="Every page will show its error message until you turn this off. Useful to see how the app handles problems."
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
            on ? 'Outage simulation is on' : 'Outage simulation is off',
            on ? 'Open any page to see its error state.' : 'Everything is loading normally again.',
          )
        }}
      />
      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-line pt-5">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-ink">Reset demo data</p>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Restores the original websites, scans and issues, then reloads the app.
          </p>
        </div>
        <Button icon={<RotateCcw aria-hidden />} onClick={() => setConfirmReset(true)}>
          Reset demo data
        </Button>
      </div>
      <Dialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="Any websites, scans, reports and status changes you made in this session will be lost."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                sessionStorage.removeItem(STORAGE_KEY)
                window.location.reload()
              }}
            >
              Reset and reload
            </Button>
          </>
        }
      >
        <p className="pb-4 text-[14px] text-ink-2">Your profile and appearance settings are kept.</p>
      </Dialog>
    </div>
  )
}

export function SettingsPage() {
  return (
    <Page>
      <PageHeader title="Settings" description="Your profile, how Clearsite looks, and tools for the demo." />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-0 flex flex-col gap-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex h-9 items-center gap-2.5 rounded-md px-3 text-[14px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-6">
          <Section id="profile" title="Profile" description="Shown in the account menu and on reports.">
            <ProfileForm />
          </Section>
          <Section
            id="appearance"
            title="Appearance"
            description="Choose how Clearsite looks. Saved in this browser."
          >
            <ThemePicker />
          </Section>
          <Section
            id="api-key"
            title="API key"
            description="For connecting Clearsite to your own tools."
            badge={
              <span className="rounded bg-surface-2 px-2 py-0.5 text-[12.5px] font-medium text-ink-2">
                Coming soon
              </span>
            }
          >
            <ApiKeyPlaceholder />
          </Section>
          <Section
            id="demo"
            title="Demo tools"
            description="For trying out the app. This demo runs on sample data stored in your browser."
          >
            <DemoTools />
          </Section>
        </div>
      </div>
    </Page>
  )
}
