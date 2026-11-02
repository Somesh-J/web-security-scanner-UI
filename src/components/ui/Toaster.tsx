import { cn } from '@/lib/cn'
import { useToastStore, type ToastTone } from '@/stores/toast'

const TONE: Record<ToastTone, { mark: string; className: string }> = {
  info: { mark: '>', className: 'text-live' },
  success: { mark: '✓', className: 'text-clear' },
  error: { mark: '!', className: 'text-signal' },
}

/** Toast stack. The region is a polite live region so screen readers announce each message once. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      role="region"
      className="pointer-events-none fixed right-3 bottom-24 z-[60] flex w-[min(380px,calc(100vw-24px))] flex-col gap-2 md:bottom-20"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className="pointer-events-auto flex animate-drawer items-start gap-3 rounded-sm border border-wire-2 bg-panel px-3.5 py-3 shadow-pop"
        >
          <span aria-hidden className={cn('font-mono text-[13px] font-semibold', TONE[t.tone].className)}>
            {TONE[t.tone].mark}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[12.5px] font-medium text-bone">{t.title}</p>
            {t.detail && <p className="mt-0.5 text-[12.5px] break-words text-ash">{t.detail}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="rounded-xs px-1 font-mono text-[11px] text-smoke hover:text-bone"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
