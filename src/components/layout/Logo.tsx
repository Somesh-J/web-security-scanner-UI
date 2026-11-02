import { cn } from '@/lib/cn'

/** Clearsite mark: a solid spruce tile with a check. The product's job is getting a site to "fixed". */
export function LogoMark({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className={cn('shrink-0', className)}>
      <rect width="32" height="32" rx="7" className="fill-brand" />
      <path
        d="M9 16.5l4.5 4.5L23 11.5"
        fill="none"
        className="stroke-brand-ink"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Mark plus wordmark, used in the sidebar and on the sign-in page. */
export function Logo({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      {!collapsed && (
        <span className="display text-[18px] font-bold tracking-[-0.03em] text-ink">clearsite</span>
      )}
    </span>
  )
}
