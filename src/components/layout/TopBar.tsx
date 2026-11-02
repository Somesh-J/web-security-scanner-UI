import * as Menu from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut, Plus, Search, Settings } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Kbd } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { LogoMark } from './Logo'

const menuItem =
  'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] text-ink outline-none data-[highlighted]:bg-surface-2'

/** Top bar: a visible search button (opens the palette), the primary "New scan" action, and the account menu. */
export function TopBar() {
  const user = useAuthStore((s) => s.session?.user)
  const signOut = useAuthStore((s) => s.signOut)
  const openNewScan = useUiStore((s) => s.openNewScan)
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const initials = (user?.name ?? 'You')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur md:px-8">
      <NavLink to="/dashboard" aria-label="Clearsite home" className="rounded-md md:hidden">
        <LogoMark />
      </NavLink>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-line-strong bg-surface px-3 text-left text-[14px] text-ink-3 transition-colors hover:border-ink-3 md:max-w-md"
        aria-label="Search issues, websites and pages"
      >
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="flex-1 truncate">Search issues, websites, pages…</span>
        <span aria-hidden className="hidden items-center gap-1 sm:flex">
          <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="primary" onClick={() => openNewScan()} icon={<Plus aria-hidden />}>
          <span className="hidden sm:inline">New scan</span>
          <span className="sr-only sm:hidden">New scan</span>
        </Button>

        <Menu.Root>
          <Menu.Trigger
            className="flex h-10 items-center gap-2 rounded-md pr-2 pl-1 text-ink-2 hover:bg-surface-2 data-[state=open]:bg-surface-2"
            aria-label={`Account menu for ${user?.name ?? 'you'}`}
          >
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-brand text-[12px] font-semibold text-brand-ink"
            >
              {initials}
            </span>
            <ChevronDown aria-hidden className="hidden size-4 sm:block" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-60 animate-fade rounded-lg border border-line bg-surface p-1.5 shadow-lg"
            >
              <div className="px-2.5 py-2">
                <p className="text-[14px] font-medium text-ink">{user?.name}</p>
                <p className="text-[13px] text-ink-3">{user?.email}</p>
              </div>
              <Menu.Separator className="my-1 h-px bg-line" />
              <Menu.Item onSelect={() => navigate('/settings')} className={menuItem}>
                <Settings aria-hidden className="size-4 text-ink-3" />
                Settings
              </Menu.Item>
              <Menu.Item
                onSelect={() => {
                  signOut()
                  qc.clear()
                  navigate('/login', { replace: true })
                }}
                className={cn(menuItem, 'text-danger')}
              >
                <LogOut aria-hidden className="size-4" />
                Sign out
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </header>
  )
}
