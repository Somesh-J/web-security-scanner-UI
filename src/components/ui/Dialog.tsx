import * as RadixDialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Mono "path" shown above the title, e.g. "targets/new". */
  eyebrow?: string
  description?: ReactNode
  children: ReactNode
  /** Omit to render children directly; they then compose DialogBody and DialogFooter themselves. */
  footer?: ReactNode
  className?: string
}

export function DialogBody({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="flex flex-wrap justify-end gap-2 border-t border-wire px-5 py-3">{children}</footer>
  )
}

/**
 * Modal dialog on Radix: focus trap, Esc to close, focus returns to the trigger, aria-modal and labelling.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 animate-fade bg-void/75 backdrop-blur-[2px]" />
        <RadixDialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[min(90dvh,760px)] w-[min(560px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 animate-fade flex-col rounded-sm border border-wire-2 bg-panel shadow-pop focus:outline-none',
            className,
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-wire px-5 pt-4 pb-3">
            <div className="min-w-0">
              {eyebrow && <p className="font-mono text-[11px] text-smoke">~/{eyebrow}</p>}
              <RadixDialog.Title className="mt-1 font-display text-[15px] font-semibold tracking-wide text-bone uppercase">
                {title}
              </RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-[13px] text-ash">
                  {description}
                </RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              className="-mr-1 rounded-xs px-1.5 py-0.5 font-mono text-[12px] text-ash hover:bg-panel-2 hover:text-bone"
              aria-label="Close"
            >
              esc
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
