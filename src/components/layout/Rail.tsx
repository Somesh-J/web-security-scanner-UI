import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { usePrefsStore } from '@/stores/prefs'
import { IconPin } from '@/components/ui/Icons'
import { Logo } from './Logo'
import { NAV_ITEMS } from './nav'

/**
 * Primary navigation. Desktop: a 56px icon rail that can be pinned open to show labels.
 * Mobile: the same items as a bottom tab bar (rendered by MobileNav).
 */
export function Rail() {
  const pinned = usePrefsStore((s) => s.railPinned)
  const setPinned = usePrefsStore((s) => s.setRailPinned)

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'hidden shrink-0 flex-col border-r border-wire bg-panel transition-[width] duration-150 md:flex',
        pinned ? 'w-48' : 'w-14',
      )}
    >
      <div className={cn('flex h-11 items-center border-b border-wire', pinned ? 'px-4' : 'justify-center')}>
        <Logo compact={!pinned} />
      </div>
      <ul className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map(({ to, label, key, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              title={pinned ? undefined : `${label}  (g ${key})`}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-10 items-center gap-3 rounded-xs text-ash transition-colors hover:bg-panel-2 hover:text-bone',
                  pinned ? 'px-3' : 'justify-center',
                  isActive && 'bg-panel-2 text-bone',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span aria-hidden className="absolute top-2 bottom-2 left-0 w-0.5 bg-signal" />
                  )}
                  <Icon />
                  <span
                    className={cn('font-mono text-[12px] tracking-wider uppercase', !pinned && 'sr-only')}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-wire p-2">
        <button
          type="button"
          onClick={() => setPinned(!pinned)}
          aria-pressed={pinned}
          className={cn(
            'flex h-9 w-full items-center gap-3 rounded-xs text-smoke hover:bg-panel-2 hover:text-bone',
            pinned ? 'px-3' : 'justify-center',
          )}
        >
          <IconPin />
          <span className={cn('font-mono text-[11px] tracking-wider uppercase', !pinned && 'sr-only')}>
            {pinned ? 'Collapse menu' : 'Expand menu'}
          </span>
        </button>
      </div>
    </nav>
  )
}

export function MobileNav() {
  return (
    <nav aria-label="Primary" className="flex border-t border-wire bg-panel md:hidden">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2 font-mono text-[9.5px] tracking-wider text-ash uppercase',
              isActive && 'text-bone',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={isActive ? 'text-signal' : undefined} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
