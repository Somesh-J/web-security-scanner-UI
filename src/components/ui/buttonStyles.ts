import { cn } from '@/lib/cn'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type Size = 'sm' | 'md'

/**
 * Terminal-style actions: [ LABEL ]. Hover and focus invert the colours, the way a TUI highlights
 * the selected control. Signal red is reserved for the one decisive action on a screen.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-signal text-signal-ink hover:bg-bone hover:text-void',
  secondary: 'text-bone hover:bg-bone hover:text-void',
  ghost: 'text-ash hover:bg-panel-2 hover:text-bone',
  danger: 'text-signal hover:bg-signal hover:text-signal-ink',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-1.5 text-[11.5px] gap-1',
  md: 'h-9 px-2 text-[12.5px] gap-1.5',
}

/** Shared by <Button> and <ButtonLink> so links that navigate look exactly like buttons that act. */
export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', className?: string) {
  return cn(
    'group/btn inline-flex shrink-0 items-center justify-center font-mono font-semibold tracking-[0.06em] uppercase whitespace-nowrap transition-colors duration-75',
    'disabled:cursor-not-allowed disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

/** The bracket glyphs around a label. Dimmed on idle, inherit the inverted colour on hover. */
export const BRACKET = 'opacity-60 group-hover/btn:opacity-100'
