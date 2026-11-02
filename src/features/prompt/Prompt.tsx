import { useQueryClient } from '@tanstack/react-query'
import { forwardRef, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCreateScan, useFindings, useScans, useTargets, queryKeys } from '@/api/queries'
import { errorMessage } from '@/api/client'
import { applyQuery } from '@/features/findings/applyQuery'
import {
  EMPTY_QUERY,
  fromSearchParams,
  parsePrompt,
  serializePrompt,
  toSearchParams,
} from '@/features/findings/query'
import { findingsToCsv } from '@/lib/csv'
import { cn } from '@/lib/cn'
import { downloadBlob } from '@/lib/download'
import { useAuthStore } from '@/stores/auth'
import { usePrefsStore } from '@/stores/prefs'
import { toast } from '@/stores/toast'
import type { Finding, Target } from '@/types/domain'
import { COMMAND_HELP, parseCommand, ROUTES } from './commands'
import { suggest, type Suggestion } from './suggest'

type Feedback = { tone: 'error' | 'info'; lines: string[] } | null

/**
 * The command prompt: a combobox that is both the command palette and a typed filter language.
 * On /findings, typing a query filters the table live; the URL stays the single source of truth.
 */
export const Prompt = forwardRef<HTMLInputElement>(function Prompt(_props, forwardedRef) {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const { data: targets = [] } = useTargets()
  const { data: findings = [] } = useFindings()
  const { data: scans = [] } = useScans()
  const createScan = useCreateScan()
  const history = usePrefsStore((s) => s.promptHistory)
  const pushHistory = usePrefsStore((s) => s.pushHistory)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const signOut = useAuthStore((s) => s.signOut)

  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [showHelp, setShowHelp] = useState(false)
  const innerRef = useRef<HTMLInputElement | null>(null)
  const listId = useId()
  const onFindings = location.pathname === '/findings'

  const ctx = useMemo(
    () => ({
      targets: targets.map((t) => ({ id: t.id, name: t.name })),
      cwes: [...new Set(findings.map((f) => f.cwe))].sort((a, b) => Number(a.slice(4)) - Number(b.slice(4))),
      scans: scans.filter((s) => s.status === 'completed').map((s) => s.id),
    }),
    [targets, findings, scans],
  )

  // Keep the prompt text in sync when filters change elsewhere (chips, sort headers, back button).
  useEffect(() => {
    if (focused) return
    setValue(onFindings ? serializePrompt(fromSearchParams(new URLSearchParams(location.search))) : '')
  }, [location.search, onFindings, focused])

  // Live filtering on /findings: debounce, then write the parsed query to the URL.
  useEffect(() => {
    if (!focused || !onFindings) return
    const command = parseCommand(value)
    if (value.trim() && command.kind !== 'query') return
    const id = window.setTimeout(() => {
      const { query, issues } = parsePrompt(value, ctx)
      const next = toSearchParams({ ...query, page: 1 }).toString()
      if (next !== new URLSearchParams(location.search).toString()) {
        navigate({ pathname: '/findings', search: next }, { replace: true })
      }
      setFeedback(issues.length ? { tone: 'error', lines: issues.map((i) => i.message) } : null)
    }, 250)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- location.search is read, not a trigger
  }, [value, focused, onFindings, ctx, navigate])

  const isFirstToken = !/\s/.test(value.trimStart())
  const { items } = useMemo(() => suggest(value, ctx, isFirstToken), [value, ctx, isFirstToken])
  const showMenu = focused && menuOpen && items.length > 0

  function setRefs(el: HTMLInputElement | null) {
    innerRef.current = el
    if (typeof forwardedRef === 'function') forwardedRef(el)
    else if (forwardedRef) forwardedRef.current = el
  }

  function accept(s: Suggestion) {
    const match = /(\S*)$/.exec(value)
    const start = value.length - (match?.[1]?.length ?? 0)
    const next = value.slice(0, start) + s.insert + (s.kind === 'key' ? '' : ' ')
    setValue(next)
    setActive(0)
    setMenuOpen(s.kind === 'key')
  }

  function resolveTarget(text: string): Target | undefined {
    const t = text.toLowerCase()
    return (
      targets.find((x) => x.id.toLowerCase() === t || x.name.toLowerCase() === t) ??
      (targets.filter((x) => x.name.toLowerCase().includes(t)).length === 1
        ? targets.find((x) => x.name.toLowerCase().includes(t))
        : undefined)
    )
  }

  async function exportCsv() {
    const all = await qc.fetchQuery<Finding[]>({ queryKey: queryKeys.findings })
    const query = onFindings ? fromSearchParams(new URLSearchParams(location.search)) : EMPTY_QUERY
    const names = new Map(targets.map((t) => [t.id, t.name]))
    const { matched } = applyQuery(all, query, { targetNames: names })
    downloadBlob(
      findingsToCsv(matched, names),
      `redcell-findings-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv',
    )
    toast.success('CSV exported', `${matched.length} findings`)
  }

  function run() {
    const input = value.trim()
    const command = parseCommand(input)
    setShowHelp(false)
    if (command.kind !== 'error') pushHistory(input)
    setHistoryIndex(-1)

    switch (command.kind) {
      case 'error':
        setFeedback({ tone: 'error', lines: [command.message] })
        return
      case 'help':
        setShowHelp(true)
        setFeedback(null)
        setValue('')
        return
      case 'goto':
        navigate(ROUTES[command.route])
        break
      case 'open':
        navigate(`/findings/${command.id}`)
        break
      case 'clear':
        navigate('/findings')
        break
      case 'theme':
        setTheme(command.mode)
        setFeedback({ tone: 'info', lines: [`Theme set to ${command.mode}.`] })
        break
      case 'logout':
        signOut()
        qc.clear()
        navigate('/login', { replace: true })
        return
      case 'export':
        exportCsv().catch((e: unknown) => toast.error('Export failed', errorMessage(e)))
        break
      case 'scan': {
        const target = resolveTarget(command.target)
        if (!target) {
          setFeedback({
            tone: 'error',
            lines: [`No single target matches "${command.target}". Use its name or ID.`],
          })
          return
        }
        createScan.mutate(target.id, {
          onSuccess: () => navigate('/scans'),
          onError: (e) => toast.error('Scan not started', errorMessage(e)),
        })
        break
      }
      case 'query': {
        const { query, issues } = parsePrompt(command.text, ctx)
        navigate({ pathname: '/findings', search: toSearchParams({ ...query, page: 1 }).toString() })
        setFeedback(issues.length ? { tone: 'error', lines: issues.map((i) => i.message) } : null)
        setMenuOpen(false)
        return
      }
    }
    setValue('')
    setMenuOpen(false)
    if (command.kind !== 'theme') setFeedback(null)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (showMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => (i + 1) % items.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i - 1 + items.length) % items.length)
        return
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && items[active]?.kind === 'key')) {
        const s = items[active]
        if (s) {
          e.preventDefault()
          accept(s)
        }
        return
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      run()
    } else if (e.key === 'Escape') {
      if (showMenu) setMenuOpen(false)
      else if (showHelp) setShowHelp(false)
      else innerRef.current?.blur()
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const next = Math.min(historyIndex + 1, history.length - 1)
      setHistoryIndex(next)
      setValue(history[next] ?? '')
    } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault()
      const next = historyIndex - 1
      setHistoryIndex(next)
      setValue(next >= 0 ? (history[next] ?? '') : '')
    }
  }

  const cwd = location.pathname.split('/').filter(Boolean)[0] ?? ''

  return (
    <div className="relative shrink-0 border-t border-wire bg-void">
      {(showHelp || feedback) && (
        <div className="border-b border-wire bg-panel px-3 py-2 md:px-4" aria-live="polite">
          {showHelp ? (
            <div>
              <p className="label mb-1.5">Commands</p>
              <dl className="grid gap-x-6 gap-y-1 font-mono text-[12px] sm:grid-cols-[auto_1fr]">
                {COMMAND_HELP.map((c) => (
                  <div key={c.usage} className="contents">
                    <dt className="text-bone">{c.usage}</dt>
                    <dd className="text-ash">{c.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            feedback?.lines.map((line) => (
              <p
                key={line}
                className={cn(
                  'font-mono text-[12px]',
                  feedback.tone === 'error' ? 'text-signal' : 'text-ash',
                )}
              >
                {feedback.tone === 'error' ? '! ' : '> '}
                {line}
              </p>
            ))
          )}
        </div>
      )}

      {showMenu && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute bottom-full left-2 z-30 mb-1 w-[min(520px,calc(100vw-16px))] rounded-sm border border-wire-2 bg-panel py-1 shadow-pop md:left-4"
        >
          {items.map((s, i) => (
            <li
              key={s.insert}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                accept(s)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'flex cursor-pointer items-baseline justify-between gap-4 px-3 py-1.5 font-mono text-[12.5px]',
                i === active ? 'bg-panel-2 text-bone' : 'text-ash',
              )}
            >
              <span className={cn(s.kind === 'command' && 'text-live')}>{s.label}</span>
              {s.hint && <span className="truncate text-[11.5px] text-smoke">{s.hint}</span>}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
        className="flex h-11 items-center gap-2 px-3 font-mono text-[13px] md:px-4"
      >
        <label htmlFor="redcell-prompt" className="shrink-0 select-none">
          <span className="text-signal">redcell</span>
          <span className="text-smoke">:</span>
          <span className="text-live">~/{cwd}</span>
          <span className="text-bone">$</span>
          <span className="sr-only">
            {' '}
            command prompt. Type a filter such as sev:crit status:open, or help.
          </span>
        </label>
        <input
          ref={setRefs}
          id="redcell-prompt"
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={showMenu ? listId : undefined}
          aria-activedescendant={showMenu ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          placeholder={focused ? '' : 'type help, a command, or a filter like sev:crit status:open'}
          onChange={(e) => {
            setValue(e.target.value)
            setActive(0)
            setMenuOpen(true)
            setHistoryIndex(-1)
          }}
          onFocus={() => {
            setFocused(true)
            setMenuOpen(true)
          }}
          onBlur={() => {
            setFocused(false)
            setMenuOpen(false)
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-bone caret-signal placeholder:text-smoke focus:outline-none focus-visible:outline-none"
        />
        <span aria-hidden className="hidden text-[11px] text-smoke sm:inline">
          {focused ? 'tab complete · ↑ history · enter run' : 'press / to focus'}
        </span>
      </form>
    </div>
  )
})
