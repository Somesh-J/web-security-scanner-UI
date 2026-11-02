import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title: string
  /** Short line under the title, written as a shell comment. */
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}

/** Screen title in VT323 (the CRT display face), with the summary as a `#` comment underneath. */
export function PageHeader({ title, meta, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[40px] leading-[0.9] tracking-wide text-bone uppercase sm:text-[46px]">
          <span aria-hidden className="text-signal">
            &gt;{' '}
          </span>
          {title}
        </h1>
        {meta && (
          <p className="mt-2 font-mono text-[12px] text-ash">
            <span aria-hidden className="text-smoke">
              #{' '}
            </span>
            {meta}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

interface PanelProps {
  /** Pane title, drawn into the top border like a TUI window. Also the region's accessible name. */
  label?: string
  /** Right-aligned text in the top border, e.g. a count or a link. */
  meta?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * A terminal pane: square single-line border with the title set into the top edge
 * (the htop / k9s / lazygit convention), instead of a rounded card.
 */
export function Panel({ label, meta, className, children }: PanelProps) {
  return (
    <section
      aria-label={label}
      className={cn('relative mt-2 min-w-0 border border-wire-2 bg-void', className)}
    >
      {(label || meta) && (
        <div className="pointer-events-none absolute -top-[9px] right-3 left-3 flex items-center justify-between gap-3 font-mono text-[11px] leading-4 tracking-[0.12em] uppercase">
          {label ? (
            <span className="bg-void px-1.5 text-bone">
              <span aria-hidden className="text-smoke">
                ┤{' '}
              </span>
              {label}
              <span aria-hidden className="text-smoke">
                {' '}
                ├
              </span>
            </span>
          ) : (
            <span />
          )}
          {meta && <span className="pointer-events-auto bg-void px-1.5 text-ash normal-case">{meta}</span>}
        </div>
      )}
      <div className="pt-1">{children}</div>
    </section>
  )
}

/** A thin toolbar row inside a pane (links, actions). */
export function PanelHeader({
  title,
  actions,
  className,
}: {
  title?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-wire px-4 py-2',
        className,
      )}
    >
      {title ? <h2 className="label">{title}</h2> : <span />}
      {actions}
    </div>
  )
}
