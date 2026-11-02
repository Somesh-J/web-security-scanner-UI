import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/** Bracket-and-block mark: a target held in brackets, the red block is the hit. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={22} height={22} aria-hidden className={className}>
      <path d="M9 7H6v18h3M23 7h3v18h-3" fill="none" stroke="currentColor" strokeWidth={2.4} />
      <rect x="12" y="12" width="8" height="8" className="fill-signal" />
    </svg>
  )
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      to="/dashboard"
      className={cn('inline-flex items-center gap-2.5 text-bone', className)}
      aria-label="REDCELL home"
    >
      <LogoMark />
      {!compact && <span className="font-display text-[14px] font-bold tracking-[0.14em]">REDCELL</span>}
    </Link>
  )
}
