import * as RadixDialog from '@radix-ui/react-dialog'
import { CornerDownLeft, Globe, Moon, Plus, Search, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFindings, useTargets } from '@/api/queries'
import { SeverityBadge } from '@/components/ui/Badges'
import { cn } from '@/lib/cn'
import { resolveTheme, usePrefsStore } from '@/stores/prefs'
import { useUiStore } from '@/stores/ui'
import type { Severity } from '@/types/domain'
import { NAV_ITEMS, SETTINGS_ITEM } from './nav'

interface PaletteItem {
  id: string
  group: 'Actions' | 'Pages' | 'Issues' | 'Websites'
  label: string
  hint?: string
  icon?: LucideIcon
  severity?: Severity
  run: () => void
}

/**
 * Ctrl/⌘K quick finder. A shortcut for people who like keyboards; never the only way to do anything —
 * every item here is also reachable from the sidebar or a visible button.
 * ARIA combobox pattern: the input owns a listbox, arrow keys move aria-activedescendant.
 */
export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen)
  const setOpen = useUiStore((s) => s.setPaletteOpen)
  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 animate-fade bg-[var(--overlay)] backdrop-blur-[2px]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-50 flex max-h-[70vh] w-[min(600px,calc(100vw-24px))] -translate-x-1/2 animate-fade flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg focus:outline-none"
        >
          <RadixDialog.Title className="sr-only">Search and quick actions</RadixDialog.Title>
          {open && <PaletteBody onClose={() => setOpen(false)} />}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { data: findings = [] } = useFindings()
  const { data: targets = [] } = useTargets()
  const openNewScan = useUiStore((s) => s.openNewScan)
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)

  const items = useMemo<PaletteItem[]>(() => {
    const q = text.trim().toLowerCase()
    const match = (s: string) => !q || s.toLowerCase().includes(q)
    const go = (to: string) => () => navigate(to)
    const resolved = resolveTheme(theme)

    const actions: PaletteItem[] = [
      { id: 'a-scan', group: 'Actions', label: 'Start a new scan', icon: Plus, run: () => openNewScan() },
      { id: 'a-site', group: 'Actions', label: 'Add a website', icon: Globe, run: go('/targets?add=1') },
      {
        id: 'a-theme',
        group: 'Actions',
        label: resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        icon: Moon,
        run: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
      },
    ]
    const pages: PaletteItem[] = [...NAV_ITEMS, SETTINGS_ITEM].map((n) => ({
      id: `p-${n.to}`,
      group: 'Pages',
      label: n.label,
      hint: n.hint,
      icon: n.icon,
      run: go(n.to),
    }))
    const issues: PaletteItem[] = q
      ? findings
          .filter((f) => match(f.title) || match(f.cwe) || match(f.location))
          .slice(0, 6)
          .map((f) => ({
            id: `f-${f.id}`,
            group: 'Issues',
            label: f.title,
            hint: f.location,
            severity: f.severity,
            run: go(`/findings/${f.id}`),
          }))
      : []
    const sites: PaletteItem[] = q
      ? targets
          .filter((t) => match(t.name) || match(t.url))
          .slice(0, 4)
          .map((t) => ({
            id: `t-${t.id}`,
            group: 'Websites',
            label: t.name,
            hint: t.url,
            icon: Globe,
            run: go(`/findings?target=${t.id}`),
          }))
      : []
    const all = [...actions, ...pages].filter((i) => match(i.label) || match(i.hint ?? ''))
    const searchAll: PaletteItem[] = q
      ? [
          {
            id: 'search-all',
            group: 'Issues',
            label: `Search all issues for “${text.trim()}”`,
            icon: Search,
            run: go(`/findings?q=${encodeURIComponent(text.trim())}`),
          },
        ]
      : []
    return [...issues, ...searchAll, ...sites, ...all]
  }, [text, findings, targets, navigate, openNewScan, theme, setTheme])

  const current = Math.min(active, Math.max(0, items.length - 1))

  function choose(item: PaletteItem | undefined) {
    if (!item) return
    onClose()
    item.run()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % Math.max(1, items.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + items.length) % Math.max(1, items.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(items[current])
    }
  }

  let lastGroup = ''
  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search aria-hidden className="size-[18px] text-ink-3" />
        <input
          role="combobox"
          aria-expanded
          aria-controls="palette-list"
          aria-activedescendant={items[current] ? `palette-${items[current].id}` : undefined}
          aria-label="Search issues, websites and pages"
          placeholder="Type to search issues, websites or pages…"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
        />
      </div>
      <ul id="palette-list" role="listbox" aria-label="Results" className="min-h-0 overflow-y-auto p-2">
        {items.length === 0 && (
          <li className="px-3 py-8 text-center text-[14px] text-ink-3">Nothing matches “{text}”.</li>
        )}
        {items.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null
          lastGroup = item.group
          const Icon = item.icon
          return (
            <li key={item.id} role="presentation">
              {header && (
                <p role="presentation" className="px-3 pt-3 pb-1 text-[12px] font-medium text-ink-3">
                  {header}
                </p>
              )}
              <div
                id={`palette-${item.id}`}
                role="option"
                aria-selected={i === current}
                tabIndex={-1}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(item)}
                onKeyDown={undefined}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-[14px]',
                  i === current ? 'bg-brand-soft text-brand-text' : 'text-ink',
                )}
              >
                {item.severity ? (
                  <SeverityBadge severity={item.severity} className="shrink-0" />
                ) : (
                  Icon && <Icon aria-hidden className="size-4 shrink-0 opacity-80" />
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                {item.hint && (
                  <span className="hidden max-w-[45%] truncate text-[13px] text-ink-3 sm:inline">
                    {item.hint}
                  </span>
                )}
                {i === current && <CornerDownLeft aria-hidden className="size-4 shrink-0" />}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
