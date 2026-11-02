import { Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useFindings, useScans } from '@/api/queries'
import { cn } from '@/lib/cn'
import { isOpenStatus } from '@/lib/labels'
import { resolveTheme, usePrefsStore } from '@/stores/prefs'
import { Logo } from './Logo'
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from './nav'

function useNavCounts() {
  const { data: scans } = useScans()
  const { data: findings } = useFindings()
  return {
    running: scans?.filter((s) => s.status === 'running' || s.status === 'queued').length ?? 0,
    open: findings?.filter((f) => isOpenStatus(f.status)).length ?? 0,
  }
}

function NavRow({ item, collapsed, badge }: { item: NavItem; collapsed: boolean; badge?: ReactNode }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex h-10 items-center gap-3 rounded-md px-3 text-[14px] font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-brand-soft text-brand-text' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        )
      }
    >
      <Icon aria-hidden className="size-[18px] shrink-0" />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && badge}
    </NavLink>
  )
}

/** Desktop navigation: always visible, icon + label for every page. Collapses to icons on request. */
export function Sidebar() {
  const collapsed = usePrefsStore((s) => s.sidebarCollapsed)
  const setCollapsed = usePrefsStore((s) => s.setSidebarCollapsed)
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const resolved = resolveTheme(theme)
  const { running, open } = useNavCounts()

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 md:flex',
        collapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      <div className={cn('flex h-16 items-center px-5', collapsed && 'justify-center px-0')}>
        <NavLink to="/dashboard" aria-label="Clearsite home" className="rounded-md">
          <Logo collapsed={collapsed} />
        </NavLink>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {NAV_ITEMS.map((item) => (
          <NavRow
            key={item.to}
            item={item}
            collapsed={collapsed}
            badge={
              item.to === '/scans' && running > 0 ? (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-brand-text">
                  <span aria-hidden className="size-1.5 rounded-full bg-brand" />
                  {running}
                  <span className="sr-only"> running</span>
                </span>
              ) : item.to === '/findings' && open > 0 ? (
                <span className="tabular rounded-full bg-surface-2 px-2 py-px text-[12px] font-medium text-ink-2">
                  {open}
                  <span className="sr-only"> open</span>
                </span>
              ) : null
            }
          />
        ))}
      </nav>
      <div className="flex flex-col gap-1 border-t border-line px-3 py-3">
        <NavRow item={SETTINGS_ITEM} collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          className={cn(
            'flex h-10 items-center gap-3 rounded-md px-3 text-[14px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
          aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {resolved === 'dark' ? (
            <Sun aria-hidden className="size-[18px]" />
          ) : (
            <Moon aria-hidden className="size-[18px]" />
          )}
          {!collapsed && (resolved === 'dark' ? 'Light mode' : 'Dark mode')}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex h-10 items-center gap-3 rounded-md px-3 text-[14px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="size-[18px]" />
          ) : (
            <PanelLeftClose aria-hidden className="size-[18px]" />
          )}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  )
}
