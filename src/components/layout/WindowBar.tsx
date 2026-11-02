import * as Menu from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/stores/auth'
import { resolveTheme, usePrefsStore } from '@/stores/prefs'
import { LogoMark } from './Logo'
import { NAV_ITEMS } from './nav'

const menuItem =
  'cursor-pointer px-2.5 py-1.5 font-mono text-[12px] text-bone outline-none data-[highlighted]:bg-bone data-[highlighted]:text-void'

/**
 * Primary navigation as a tmux window list across the top: `1:dashboard  2:targets  4:findings*`.
 * The active window is drawn in inverse video. Alt+1..6 switch windows. Scrolls sideways on phones.
 */
export function WindowBar() {
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const user = useAuthStore((s) => s.session?.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const resolved = resolveTheme(theme)
  const initials = (user?.name ?? 'OP')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="flex h-9 shrink-0 items-stretch border-b border-wire-2 bg-void font-mono text-[12.5px]">
      <NavLink
        to="/dashboard"
        className="flex shrink-0 items-center gap-2 border-r border-wire-2 px-3 text-bone"
        aria-label="REDCELL home"
      >
        <LogoMark />
        <span className="hidden font-display text-[22px] leading-none tracking-[0.08em] sm:inline">
          REDCELL
        </span>
      </NavLink>

      <nav aria-label="Primary" className="min-w-0 flex-1 overflow-x-auto">
        <ul className="flex h-full items-stretch">
          {NAV_ITEMS.map((item, i) => (
            <li key={item.to} className="flex">
              <NavLink
                to={item.to}
                title={`Alt+${i + 1} or g ${item.key}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 whitespace-nowrap transition-colors duration-75',
                    isActive ? 'bg-bone text-void' : 'text-ash hover:bg-panel-2 hover:text-bone',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-void/60' : 'text-smoke'}>{i + 1}:</span>
                    {item.label}
                    <span aria-hidden className="w-[1ch]">
                      {isActive ? '*' : ''}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex shrink-0 items-stretch border-l border-wire-2">
        <button
          type="button"
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          className="px-3 text-ash hover:bg-bone hover:text-void"
          aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <span aria-hidden>[{resolved === 'dark' ? 'light' : 'dark'}]</span>
        </button>
        <Menu.Root>
          <Menu.Trigger
            className="border-l border-wire-2 px-3 font-semibold text-bone hover:bg-bone hover:text-void data-[state=open]:bg-bone data-[state=open]:text-void"
            aria-label={`Account menu for ${user?.name ?? 'operator'}`}
          >
            {initials} <span aria-hidden>▾</span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content
              align="end"
              sideOffset={0}
              className="z-50 min-w-56 animate-fade border border-wire-2 bg-void p-1 shadow-pop"
            >
              <div className="px-2.5 py-2">
                <p className="text-[12.5px] text-bone">{user?.name}</p>
                <p className="text-[11.5px] text-ash">{user?.email}</p>
              </div>
              <Menu.Separator className="my-1 border-t border-dashed border-wire-2" />
              <Menu.Item onSelect={() => navigate('/settings')} className={menuItem}>
                settings
              </Menu.Item>
              <Menu.Item
                onSelect={() => {
                  signOut()
                  qc.clear()
                  navigate('/login', { replace: true })
                }}
                className={cn(menuItem, 'text-signal')}
              >
                logout
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </header>
  )
}
