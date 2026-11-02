import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToastStore, type ToastTone } from '@/stores/toast'

const TONE: Record<ToastTone, { Icon: typeof Info; className: string }> = {
  info: { Icon: Info, className: 'text-brand-text' },
  success: { Icon: CircleCheck, className: 'text-success' },
  error: { Icon: CircleAlert, className: 'text-danger' },
}

/** Toast stack, bottom-right. A polite live region so screen readers announce each message once. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      role="region"
      className="pointer-events-none fixed right-4 bottom-20 z-[60] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2 md:bottom-6"
    >
      {toasts.map((t) => {
        const { Icon, className } = TONE[t.tone]
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex animate-rise items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-lg"
          >
            <Icon aria-hidden className={cn('mt-0.5 size-[18px] shrink-0', className)} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-ink">{t.title}</p>
              {t.detail && <p className="mt-0.5 text-[13px] break-words text-ink-2">{t.detail}</p>}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick()
                    dismiss(t.id)
                  }}
                  className="mt-1.5 text-[13px] font-semibold text-brand-text hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mr-1 inline-flex size-6 items-center justify-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
