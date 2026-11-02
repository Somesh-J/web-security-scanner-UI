import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  /** Omit to render children directly; they then compose DialogBody and DialogFooter themselves. */
  footer?: ReactNode
  className?: string
}

export function DialogBody({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">{children}</div>
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2/60 px-6 py-4">
      {children}
    </footer>
  )
}

/**
 * Modal dialog on Radix: focus trap, Esc to close, focus returns to the trigger, aria-modal and labelling.
 */
export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 animate-fade bg-[var(--overlay)] backdrop-blur-[2px]" />
        <RadixDialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[min(90dvh,760px)] w-[min(520px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 animate-pop flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg focus:outline-none',
            className,
          )}
        >
          <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div className="min-w-0">
              <RadixDialog.Title className="text-[18px] leading-7 font-semibold text-ink">
                {title}
              </RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-[14px] text-ink-2">
                  {description}
                </RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              className="-mt-1 -mr-2 inline-flex size-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink"
              aria-label="Close"
            >
              <X aria-hidden className="size-[18px]" />
            </RadixDialog.Close>
          </header>
          {footer === undefined ? (
            children
          ) : (
            <>
              <DialogBody>{children}</DialogBody>
              <DialogFooter>{footer}</DialogFooter>
            </>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
