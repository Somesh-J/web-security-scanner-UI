import * as Menu from '@radix-ui/react-dropdown-menu'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IconMoon, IconSun } from '@/components/ui/Icons'
import { Kbd } from '@/components/ui/States'
import { resolveTheme, usePrefsStore } from '@/stores/prefs'
import { useAuthStore } from '@/stores/auth'
import { useQueryClient } from '@tanstack/react-query'
import { LogoMark } from './Logo'

/** The current path as a working directory, each segment a link: ~/findings/fnd_5231 */
function PathCrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 truncate font-mono text-[12.5px]">
      <ol className="flex items-center">
        <li className="text-smoke">~</li>
        {parts.map((part, i) => {
          const href = `/${parts.slice(0, i + 1).join('/')}`
          const last = i === parts.length - 1
          return (
            <li key={href} className="flex min-w-0 items-center">
              <span className="text-smoke">/</span>
              {last ? (
                <span aria-current="page" className="truncate text-bone">
                  {part}
                </span>
              ) : (
                <Link to={href} className="text-ash hover:text-bone">
                  {part}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function ContextBar({ onFocusPrompt }: { onFocusPrompt: () => void }) {
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
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-wire bg-panel px-3 md:px-4">
      <span className="text-bone md:hidden">
        <LogoMark />
      </span>
      <PathCrumbs />
      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onFocusPrompt}
          className="hidden h-7 items-center gap-2 rounded-xs border border-wire px-2 font-mono text-[11.5px] text-ash hover:border-wire-2 hover:text-bone sm:flex"
        >
          command
          <Kbd>/</Kbd>
        </button>
        <button
          type="button"
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          className="flex size-8 items-center justify-center rounded-xs text-ash hover:bg-panel-2 hover:text-bone"
          aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={resolved === 'dark' ? 'Light theme (Dossier)' : 'Dark theme (Ops)'}
        >
          {resolved === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <Menu.Root>
          <Menu.Trigger
            className="flex size-8 items-center justify-center rounded-xs border border-wire-2 font-mono text-[11px] font-semibold text-bone hover:border-bone"
            aria-label={`Account menu for ${user?.name ?? 'operator'}`}
          >
            {initials}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-56 animate-fade rounded-sm border border-wire-2 bg-panel p-1 shadow-pop"
            >
              <div className="px-2.5 py-2">
                <p className="text-[13px] font-medium text-bone">{user?.name}</p>
                <p className="font-mono text-[11.5px] text-ash">{user?.email}</p>
              </div>
              <Menu.Separator className="my-1 h-px bg-wire" />
              <Menu.Item
                onSelect={() => navigate('/settings')}
                className="cursor-pointer rounded-xs px-2.5 py-1.5 font-mono text-[12px] text-bone outline-none data-[highlighted]:bg-panel-2"
              >
                Settings
              </Menu.Item>
              <Menu.Item
                onSelect={() => {
                  signOut()
                  qc.clear()
                  navigate('/login', { replace: true })
                }}
                className="cursor-pointer rounded-xs px-2.5 py-1.5 font-mono text-[12px] text-signal outline-none data-[highlighted]:bg-panel-2"
              >
                Sign out
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </header>
  )
}
