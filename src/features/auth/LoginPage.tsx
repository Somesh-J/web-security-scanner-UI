import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { errorMessage } from '@/api/client'
import { useLogin } from '@/api/queries'
import { Logo } from '@/components/layout/Logo'
import { SeverityBadge } from '@/components/ui/Badges'
import { Button, IconButton } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { DEMO_ACCOUNT } from '@/lib/demo'
import { safeNext } from '@/lib/safeNext'
import { loginSchema, type LoginValues } from '@/lib/schemas'
import { useAuthStore } from '@/stores/auth'
import type { LoginInput, Severity } from '@/types/domain'

/** A static excerpt of the real "Fix first" list, so visitors see the product rather than a slogan. */
const SAMPLE: { severity: Severity; title: string; site: string }[] = [
  { severity: 'critical', title: 'SQL injection in product search', site: 'Acme Store' },
  { severity: 'high', title: 'Reflected XSS in order status', site: 'Acme Store' },
  { severity: 'medium', title: 'Missing security headers', site: 'Marketing Site' },
]

export function LoginPage() {
  useDocumentTitle('Sign in')
  const token = useAuthStore((s) => s.session?.token)
  const signIn = useAuthStore((s) => s.signIn)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  if (token) return <Navigate to={next} replace />

  const submit = (values: LoginInput) =>
    login.mutate(values, {
      onSuccess: (session) => {
        signIn(session)
        navigate(next, { replace: true })
      },
    })

  const onSubmit = handleSubmit(submit)

  /** Fills the demo credentials and signs in, in one click: the fastest path for first-time visitors. */
  function signInWithDemo() {
    setValue('email', DEMO_ACCOUNT.email)
    setValue('password', DEMO_ACCOUNT.password)
    clearErrors()
    submit(DEMO_ACCOUNT)
  }

  const authError = login.error ? errorMessage(login.error) : null

  return (
    <main className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section
        aria-label="About Clearsite"
        className="hidden flex-col justify-between gap-12 border-r border-line bg-surface-2 p-12 lg:flex xl:p-16"
      >
        <Logo />

        <div className="max-w-xl">
          <h2 className="display text-[40px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink">
            Know what&rsquo;s wrong with your website, and how to fix it.
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-7 text-ink-2">
            Clearsite scans your sites and APIs, then gives you a short fix list in plain English.
          </p>
        </div>

        <figure aria-hidden className="card max-w-xl">
          <figcaption className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-[14px] font-semibold text-ink">Fix first</span>
            <span className="text-[13px] text-ink-3">3 of 36 open issues</span>
          </figcaption>
          <ul className="divide-y divide-line">
            {SAMPLE.map((row) => (
              <li
                key={row.title}
                className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3"
              >
                <SeverityBadge severity={row.severity} className="justify-self-start" />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium text-ink">{row.title}</span>
                  <span className="block text-[13px] text-ink-3">{row.site}</span>
                </span>
                <span className="text-[13px] font-medium text-brand-text">How to fix</span>
              </li>
            ))}
          </ul>
        </figure>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="display text-[30px] leading-9 font-semibold tracking-[-0.025em] text-ink">
            Sign in
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-2">Use your work email.</p>

          <form noValidate onSubmit={(e) => void onSubmit(e)} className="mt-8 flex flex-col gap-5">
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              error={errors.password?.message}
              trailing={
                <IconButton
                  size="sm"
                  label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </IconButton>
              }
              {...register('password')}
            />

            {authError && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-[14px] text-danger"
              >
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {authError}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" loading={login.isPending} className="w-full">
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-[14px] text-ink-2">Just looking around? Use the demo account.</p>
            <Button className="mt-3 w-full" onClick={signInWithDemo} disabled={login.isPending}>
              Try the demo account
            </Button>
            <p className="mt-3 text-[13px] text-ink-3">
              {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
