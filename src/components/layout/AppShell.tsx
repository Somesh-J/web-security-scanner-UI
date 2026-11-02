import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { queryKeys, useScans } from '@/api/queries'
import { Prompt } from '@/features/prompt/Prompt'
import { toast } from '@/stores/toast'
import type { Scan } from '@/types/domain'
import { NAV_ITEMS } from './nav'
import { StatusBar } from './StatusBar'
import { WindowBar } from './WindowBar'

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

/**
 * When a scan we saw running finishes, refresh the data it changes and tell the operator.
 * This is what closes the workflow loop: launch scan -> watch progress -> findings appear.
 */
function useScanCompletionWatcher() {
  const { data: scans } = useScans()
  const qc = useQueryClient()
  const previous = useRef<Map<string, Scan['status']>>(new Map())

  useEffect(() => {
    if (!scans) return
    for (const scan of scans) {
      const before = previous.current.get(scan.id)
      if ((before === 'running' || before === 'queued') && scan.status === 'completed') {
        void qc.invalidateQueries({ queryKey: queryKeys.findings })
        void qc.invalidateQueries({ queryKey: queryKeys.targets })
        const total = Object.values(scan.findingsCount).reduce((a, b) => a + b, 0)
        toast.success(
          `${scan.id} completed`,
          `${total} findings. Type "scan:${scan.id}" in the prompt to review them.`,
        )
      }
    }
    previous.current = new Map(scans.map((s) => [s.id, s.status]))
  }, [scans, qc])
}

export function AppShell() {
  const promptRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  useScanCompletionWatcher()

  useEffect(() => {
    let gPressedAt = 0
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        promptRef.current?.focus()
        return
      }
      if (e.altKey && /^[1-6]$/.test(e.key)) {
        const item = NAV_ITEMS[Number(e.key) - 1]
        if (item) {
          e.preventDefault()
          navigate(item.to)
        }
        return
      }
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '/') {
        e.preventDefault()
        promptRef.current?.focus()
        return
      }
      if (e.key === 'g') {
        gPressedAt = Date.now()
        return
      }
      if (Date.now() - gPressedAt < 900) {
        const item = NAV_ITEMS.find((n) => n.key === e.key)
        if (item) {
          e.preventDefault()
          navigate(item.to)
        }
        gPressedAt = 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <a
        href="#main"
        className="sr-only z-[70] bg-signal px-3 py-2 font-mono text-[12px] text-signal-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <WindowBar />
      <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none">
        <Outlet />
      </main>
      <Prompt ref={promptRef} />
      <StatusBar />
    </div>
  )
}
