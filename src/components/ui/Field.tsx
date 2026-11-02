import * as RadixSwitch from '@radix-ui/react-switch'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Form fields with built-in label, hint and inline error wiring.
 * aria-invalid and aria-describedby are set automatically so screen readers announce the error.
 */

interface FieldShellProps {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}

function FieldShell({ id, label, hint, error, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="font-mono text-[12px] text-signal">
          <span aria-hidden>! </span>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-ash">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const controlClass =
  'h-10 w-full min-w-0 border bg-void px-3 font-mono text-[13px] text-bone placeholder:text-smoke transition-colors focus:border-live focus:outline-none focus-visible:outline-none disabled:opacity-60'

function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: ReactNode
  error?: string
  trailing?: ReactNode
  fieldClassName?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, trailing, id: idProp, className, fieldClassName, ...rest },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={fieldClassName}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(
            controlClass,
            error ? 'border-signal' : 'border-wire-2',
            trailing ? 'pr-10' : '',
            className,
          )}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
    </FieldShell>
  )
})

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: ReactNode
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, options, placeholder, id: idProp, className, ...rest },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          controlClass,
          'cursor-pointer appearance-none bg-no-repeat pr-8',
          error ? 'border-signal' : 'border-wire-2',
          className,
        )}
        style={{
          backgroundImage:
            'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
          backgroundPosition: 'calc(100% - 16px) 50%, calc(100% - 11px) 50%',
          backgroundSize: '5px 5px, 5px 5px',
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
})

export interface SwitchProps {
  id?: string
  label: string
  description?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

/** Accessible toggle (Radix Switch: role="switch", Space/Enter to toggle). */
export function Switch({ id: idProp, label, description, checked, onCheckedChange, disabled }: SwitchProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-[13px] font-medium text-bone">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-[12px] text-ash">
            {description}
          </p>
        )}
      </div>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? `${id}-desc` : undefined}
        className="group shrink-0 cursor-pointer px-1 font-mono text-[12px] font-semibold whitespace-pre text-ash hover:bg-panel-2 disabled:opacity-50 data-[state=checked]:bg-bone data-[state=checked]:text-void"
      >
        {/* Terminal toggle: [ on] / [off]. Radix still provides role="switch" and aria-checked. */}
        <span aria-hidden>{checked ? '[ on]' : '[off]'}</span>
      </RadixSwitch.Root>
    </div>
  )
}
