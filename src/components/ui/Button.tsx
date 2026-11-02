import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { BRACKET, buttonClass, type Size, type Variant } from './buttonStyles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon,
    loading,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      <span aria-hidden className={BRACKET}>
        [
      </span>
      {loading ? <Spinner /> : icon}
      {children}
      <span aria-hidden className={BRACKET}>
        ]
      </span>
    </button>
  )
})

/** A router link styled as a button, for actions that navigate. Avoids nesting a button inside a link. */
export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      <span aria-hidden className={BRACKET}>
        [
      </span>
      {icon}
      {children}
      <span aria-hidden className={BRACKET}>
        ]
      </span>
    </Link>
  )
}

/** Classic terminal spinner: | / - \ cycling via CSS steps. */
export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden data-spinner className={cn('inline-block w-[1ch] text-center', className)} />
}
