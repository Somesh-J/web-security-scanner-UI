import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { queryKeys, useScans, useTargets } from '@/api/queries'
import { TooltipProvider } from '@/components/ui/Help'
import { NewScanDialog } from '@/features/scans/NewScanDialog'
import { toast } from '@/stores/toast'
import { useUiStore } from '@/stores/ui'
import type { Scan } from '@/types/domain'
import { CommandPalette } from './CommandPalette'
import { MobileTabBar } from './MobileTabBar'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

/**
 * When a scan we saw running finishes, refresh the data it changes and tell the user, with a direct
 * link to the issues it found. This closes the workflow loop: start scan -> watch progress -> review.
 */
function useScanCompletionWatcher() {
  const { data: scans } = useScans()
  const { data: targets } = useTargets()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const previous = useRef<Map<string, Scan['status']>>(new Map())

  useEffect(() => {
    if (!scans) return
    for (const scan of scans) {
      const before = previous.current.get(scan.id)
      if ((before === 'running' || before === 'queued') && scan.status === 'completed') {
        void qc.invalidateQueries({ queryKey: queryKeys.findings })
        void qc.invalidateQueries({ queryKey: queryKeys.targets })
        const total = Object.values(scan.findingsCount).reduce((a, b) => a + b, 0)
        const name = targets?.find((t) => t.id === scan.targetId)?.name ?? 'your website'
        toast.success(`Scan of ${name} finished`, `${total} issue${total === 1 ? '' : 's'} found.`, {
          label: 'Review issues',
          onClick: () => navigate(`/findings?scan=${scan.id}`),
        })
      }
    }
    previous.current = new Map(scans.map((s) => [s.id, s.status]))
  }, [scans, targets, qc, navigate])
}

export function AppShell() {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
  const newScan = useUiStore((s) => s.newScan)
  const setNewScanOpen = useUiStore((s) => s.setNewScanOpen)
  useScanCompletionWatcher()

  // Ctrl/⌘K opens the quick finder. A convenience only: everything is also in the sidebar or a button.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaletteOpen])

  return (
    <TooltipProvider>
      <div className="flex h-dvh min-h-0 overflow-hidden bg-bg">
        <a
          href="#main"
          className="sr-only z-[70] rounded-md bg-brand px-3 py-2 text-[14px] font-medium text-brand-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main
            id="main"
            tabIndex={-1}
            className="relative min-h-0 flex-1 overflow-y-auto pb-20 focus:outline-none md:pb-0"
          >
            <Outlet />
          </main>
        </div>
        <MobileTabBar />
        <CommandPalette />
        <NewScanDialog open={newScan.open} onOpenChange={setNewScanOpen} initialTargetId={newScan.targetId} />
      </div>
    </TooltipProvider>
  )
}
