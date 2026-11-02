/** Bracket-and-block mark: a target held in brackets, the red block is the hit. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={22} height={22} aria-hidden className={className}>
      <path d="M9 7H6v18h3M23 7h3v18h-3" fill="none" stroke="currentColor" strokeWidth={2.4} />
      <rect x="12" y="12" width="8" height="8" className="fill-signal" />
    </svg>
  )
}
