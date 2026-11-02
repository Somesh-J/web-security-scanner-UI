import { Link } from 'react-router-dom'
import { useScans } from '@/api/queries'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatUtc } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { useNetStore } from '@/stores/net'

/** tmux-style status line: who is operating, what is live, API health, and UTC time. */
export function StatusBar() {
  const email = useAuthStore((s) => s.session?.user.email)
  const { data: scans } = useScans()
  const latency = useNetStore((s) => s.latencyMs)
  const ok = useNetStore((s) => s.ok)
  const now = useNow(15_000)
  const live = scans?.filter((s) => s.status === 'running').length ?? 0
  const queued = scans?.filter((s) => s.status === 'queued').length ?? 0

  return (
    <footer className="hidden h-7 shrink-0 items-center gap-0 border-t border-wire bg-panel font-mono text-[11px] text-ash md:flex">
      <span className="flex h-full items-center bg-signal px-3 font-semibold tracking-wider text-signal-ink">
        OP
      </span>
      <span className="px-3">{email}</span>
      <Sep />
      <Link to="/scans" className="flex items-center gap-2 px-3 hover:text-bone">
        <span
          aria-hidden
          className={cn('size-1.5 rounded-full', live ? 'animate-pulse-live bg-live' : 'bg-smoke')}
        />
        {live} scan{live === 1 ? '' : 's'} live{queued ? ` · ${queued} queued` : ''}
      </Link>
      <Sep />
      <span className="flex items-center gap-2 px-3" title="Mock API health and last round-trip time">
        API
        <span aria-hidden className={cn('size-1.5 rounded-full', ok ? 'bg-clear' : 'bg-signal')} />
        <span className="sr-only">{ok ? 'healthy' : 'returning errors'}</span>
        <span className="tabular">{latency === null ? '—' : `${latency}ms`}</span>
      </span>
      <span className="ml-auto px-3 tabular">{formatUtc(new Date(now).toISOString())}</span>
    </footer>
  )
}

function Sep() {
  return <span aria-hidden className="h-3 w-px bg-wire-2" />
}
