import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from './nav'

const SHORT: Record<string, string> = {
  '/dashboard': 'Overview',
  '/targets': 'Websites',
  '/scans': 'Scans',
  '/findings': 'Issues',
  '/reports': 'Reports',
}

/** Phone navigation: a bottom tab bar with the five main pages (Settings lives in the account menu). */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                    isActive ? 'text-brand-text' : 'text-ink-3',
                  )
                }
              >
                <Icon aria-hidden className="size-5" />
                {SHORT[item.to] ?? item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
