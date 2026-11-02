import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'

interface PageHeaderProps {
  title: string
  /** One plain sentence under the title saying what this page is for. */
  description?: ReactNode
  actions?: ReactNode
  /** Browser tab title, when it should differ from the heading (e.g. a sentence-style heading). */
  documentTitle?: string
  className?: string
}

/** One H1 per page in the display face, a one-line description, and the page's main action. */
export function PageHeader({ title, description, actions, documentTitle, className }: PageHeaderProps) {
  useDocumentTitle(documentTitle ?? title)
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-8 gap-y-4', className)}>
      <div className="min-w-0 max-w-3xl">
        <h1 className="display text-[28px] leading-[1.15] font-semibold text-ink md:text-[32px]">{title}</h1>
        {description && <p className="mt-2 text-[15px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Standard page container: centred, max 1280 px, consistent padding, gentle entry. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[1200px] animate-rise flex-col gap-8 px-4 py-6 md:px-10 md:py-10',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardProps {
  /** Card heading. Also the region's accessible name. */
  title?: ReactNode
  /** Short helper text under the title. */
  description?: ReactNode
  /** Right side of the header, e.g. a "View all" link. */
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
  as?: 'section' | 'div'
}

/** Surface card: border, 12 px radius, soft shadow, optional header. */
export function Card({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
  as: Tag = 'section',
}: CardProps) {
  return (
    <Tag className={cn('card min-w-0', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-[16px] leading-6 font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </Tag>
  )
}
