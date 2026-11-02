import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, errorMessage } from '@/api/client'
import { useLogin } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { LogoMark } from '@/components/layout/Logo'
import { loginSchema, type LoginValues } from '@/lib/schemas'
import { DEMO_ACCOUNT } from '@/lib/demo'
import { safeNext } from '@/lib/safeNext'
import { useAuthStore } from '@/stores/auth'

const BOOT_LINES = [
  'redcell console v2.6.0',
  'loading modules ............ ok',
  'tls 1.3 handshake .......... ok',
  'mock api (msw) ............. ok',
  'audit log .................. armed',
  'awaiting operator',
]

/** Types the boot log once. Skips straight to the end on any key, and under reduced motion. */
function useBootLog() {
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [count, setCount] = useState(reduce ? BOOT_LINES.length : 0)
  useEffect(() => {
    if (count >= BOOT_LINES.length) return
    const id = window.setTimeout(() => setCount((c) => c + 1), count === 0 ? 150 : 210)
    const skip = () => setCount(BOOT_LINES.length)
    window.addEventListener('keydown', skip, { once: true })
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', skip)
    }
  }, [count])
  return BOOT_LINES.slice(0, count)
}

export function LoginPage() {
  const token = useAuthStore((s) => s.session?.token)
  const signIn = useAuthStore((s) => s.signIn)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const login = useLogin()
  const lines = useBootLog()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  if (token) return <Navigate to={next} replace />

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (session) => {
        signIn(session)
        navigate(next, { replace: true })
      },
    })
  })

  const authError =
    login.error instanceof ApiError && login.error.status === 401
      ? login.error.message
      : login.error
        ? errorMessage(login.error)
        : null

  return (
    <main className="grid min-h-dvh bg-void md:grid-cols-[1.1fr_1fr]">
      {/* Left: the one ambient moment in the product. */}
      <section
        aria-label="System status"
        className="relative hidden overflow-hidden border-r border-wire bg-panel md:flex md:flex-col md:justify-between md:p-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--wire-2) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
          }}
        />
        <div className="relative flex items-center gap-3 text-bone">
          <LogoMark />
          <span className="font-display text-[15px] font-bold tracking-[0.16em]">REDCELL</span>
        </div>
        <pre className="relative font-mono text-[13px] leading-7 text-ash" aria-hidden>
          {lines.map((line, i) => (
            <div key={line}>
              <span className="text-signal">&gt;</span> {line.replace(/ok$|armed$/, '')}
              {/ok$/.test(line) && <span className="text-clear">ok</span>}
              {/armed$/.test(line) && <span className="text-live">armed</span>}
              {i === lines.length - 1 && i === BOOT_LINES.length - 1 && (
                <span className="ml-1 animate-blink text-bone">█</span>
              )}
            </div>
          ))}
        </pre>
        <div className="relative">
          <p className="font-display text-[20px] font-semibold tracking-wide text-bone uppercase">
            Authorised targets only.
          </p>
          <p className="mt-2 max-w-sm text-[13px] text-ash">
            Every scan from this console is logged. Only test systems you have written permission to test.
          </p>
        </div>
      </section>

      {/* Right: the access gate. */}
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 text-bone md:hidden">
            <LogoMark />
            <span className="font-display text-[15px] font-bold tracking-[0.16em]">REDCELL</span>
          </div>
          <p className="font-mono text-[11px] text-smoke">~/login</p>
          <h1 className="mt-1 font-display text-[24px] font-semibold tracking-wide text-bone uppercase">
            Access gate
          </h1>
          <p className="mt-2 text-[13px] text-ash">Sign in to run scans and triage findings.</p>

          <form noValidate onSubmit={(e) => void onSubmit(e)} className="mt-8 flex flex-col gap-5">
            <TextField
              label="Operator email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Passphrase"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {authError && (
              <p
                role="alert"
                className="rounded-xs border border-signal/50 bg-signal/10 px-3 py-2 font-mono text-[12.5px] text-signal"
              >
                ACCESS DENIED. {authError.replace(/^Access denied\.\s*/, '')}
              </p>
            )}

            <Button type="submit" variant="primary" loading={login.isPending} className="h-10 w-full">
              {login.isPending ? 'Authenticating' : 'Authenticate'}
            </Button>
          </form>

          <div className="mt-8 rounded-xs border border-dashed border-wire-2 px-3 py-3">
            <p className="label">Demo account</p>
            <p className="mt-1.5 font-mono text-[12.5px] text-bone">
              {DEMO_ACCOUNT.email} <span className="text-smoke">/</span> {DEMO_ACCOUNT.password}
            </p>
            <button
              type="button"
              className="mt-2 font-mono text-[12px] text-live underline-offset-4 hover:underline"
              onClick={() => {
                setValue('email', DEMO_ACCOUNT.email, { shouldValidate: true })
                setValue('password', DEMO_ACCOUNT.password, { shouldValidate: true })
              }}
            >
              Fill demo credentials
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
