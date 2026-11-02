import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'
import { CircleHelp } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * "What's this?" helper: a small (?) button that opens a short plain-language explanation.
 * A popover (click/Enter) rather than a hover-only tooltip, so it works on touch and with a keyboard.
 */
export function HelpPopover({
  label,
  children,
  className,
}: {
  /** Accessible name, e.g. "What is CWE?". */
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={label}
        className={cn(
          'inline-flex size-5 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink',
          className,
        )}
      >
        <CircleHelp aria-hidden className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          collisionPadding={12}
          className="z-50 max-w-72 animate-fade rounded-lg border border-line bg-surface p-3.5 text-[13px] leading-5 text-ink-2 shadow-lg"
        >
          {children}
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** Hover/focus tooltip for icon-only controls. */
export function Tip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <Tooltip.Root delayDuration={300}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          className="z-50 animate-fade rounded-md bg-ink px-2.5 py-1.5 text-[12.5px] font-medium text-surface shadow-md"
        >
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export const TooltipProvider = Tooltip.Provider
