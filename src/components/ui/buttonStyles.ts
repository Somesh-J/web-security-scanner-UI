import { cn } from '@/lib/cn'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  // Signal red is reserved for the decisive action on a screen ("launch", "authenticate", "add").
  primary: 'bg-signal text-signal-ink border-signal hover:brightness-110',
  secondary: 'bg-panel text-bone border-wire-2 hover:border-bone hover:bg-panel-2',
  ghost: 'bg-transparent text-ash border-transparent hover:text-bone hover:bg-panel-2',
  danger: 'bg-transparent text-signal border-signal/60 hover:bg-signal/10 hover:border-signal',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[11px] gap-1.5',
  md: 'h-9 px-3.5 text-[12px] gap-2',
}

/** Shared by <Button> and <ButtonLink> so links that navigate look exactly like buttons that act. */
export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-xs border font-mono font-semibold tracking-[0.08em] uppercase transition-[background-color,border-color,filter,color] duration-100',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
