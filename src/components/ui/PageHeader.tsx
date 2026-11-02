import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title: string
  /** Short line under the title: what this screen is for, or a live count. */
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}

/** Screen title in Martian Mono (the one display face), with actions aligned right. */
export function PageHeader({ title, meta, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[22px] leading-tight font-semibold tracking-wide text-bone uppercase sm:text-[26px]">
          {title}
        </h1>
        {meta && <p className="mt-1.5 font-mono text-[12px] text-ash">{meta}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Bordered surface for tables and grouped content. */
export function Panel({
  className,
  children,
  label,
}: {
  className?: string
  children: ReactNode
  label?: string
}) {
  return (
    <section aria-label={label} className={cn('min-w-0 rounded-sm border border-wire bg-panel', className)}>
      {children}
    </section>
  )
}

export function PanelHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b border-wire px-4 py-2.5',
        className,
      )}
    >
      <h2 className="label">{title}</h2>
      {actions}
    </div>
  )
}
