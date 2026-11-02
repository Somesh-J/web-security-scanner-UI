import { cn } from '@/lib/cn'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type Size = 'sm' | 'md' | 'lg'

/**
 * One primary (brand-filled) action per screen; secondary for everything else; ghost for quiet
 * toolbar actions; danger only for the confirm step of a destructive action.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:bg-brand-hover',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-ink-3 hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-surface hover:opacity-90',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 [&_svg]:size-3.5',
  md: 'h-9 px-3.5 text-[14px] gap-2 [&_svg]:size-4',
  lg: 'h-11 px-5 text-[15px] gap-2 [&_svg]:size-[18px]',
}

/** Shared by <Button> and <ButtonLink> so links that navigate look exactly like buttons that act. */
export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-[background-color,color,opacity,box-shadow] duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
