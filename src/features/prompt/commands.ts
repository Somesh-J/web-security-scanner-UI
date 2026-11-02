import type { ThemeMode } from '@/stores/prefs'

/**
 * The prompt understands a few commands. Anything else is treated as a findings query
 * ("sev:crit status:open sql"), which keeps the common case typing-free.
 */

export const ROUTES = {
  dashboard: '/dashboard',
  targets: '/targets',
  scans: '/scans',
  findings: '/findings',
  reports: '/reports',
  settings: '/settings',
} as const
export type RouteName = keyof typeof ROUTES

export type Command =
  | { kind: 'goto'; route: RouteName }
  | { kind: 'open'; id: string }
  | { kind: 'scan'; target: string }
  | { kind: 'export' }
  | { kind: 'theme'; mode: ThemeMode }
  | { kind: 'help' }
  | { kind: 'clear' }
  | { kind: 'logout' }
  | { kind: 'query'; text: string }
  | { kind: 'error'; message: string }

export interface CommandHelp {
  usage: string
  description: string
}

export const COMMAND_HELP: CommandHelp[] = [
  {
    usage: 'sev:crit,high status:open sql',
    description: 'Filter findings (keys: sev status cat cwe target scan sort page size)',
  },
  { usage: 'goto <screen>', description: 'Go to dashboard, targets, scans, findings, reports or settings' },
  { usage: 'open <finding id>', description: 'Open a finding, for example open fnd_5231' },
  { usage: 'scan <target>', description: 'Launch a scan against a target, by name or ID' },
  { usage: 'export csv', description: 'Download the current findings view as CSV' },
  { usage: 'theme dark|light|system', description: 'Switch the colour theme' },
  { usage: 'clear', description: 'Clear all findings filters' },
  { usage: 'logout', description: 'Sign out' },
  { usage: 'help', description: 'Show this list' },
]

const ROUTE_ALIASES: Record<string, RouteName> = {
  dashboard: 'dashboard',
  dash: 'dashboard',
  home: 'dashboard',
  sitrep: 'dashboard',
  targets: 'targets',
  target: 'targets',
  scans: 'scans',
  scan: 'scans',
  ops: 'scans',
  findings: 'findings',
  finding: 'findings',
  vulns: 'findings',
  reports: 'reports',
  report: 'reports',
  settings: 'settings',
  config: 'settings',
}

export function parseCommand(input: string): Command {
  const text = input.trim()
  if (!text) return { kind: 'error', message: 'Type a command or a filter. Try help.' }
  const [head = '', ...rest] = text.split(/\s+/)
  const arg = rest.join(' ').trim()
  const verb = head.toLowerCase()

  switch (verb) {
    case 'help':
    case '?':
      return { kind: 'help' }
    case 'clear':
    case 'reset':
      return { kind: 'clear' }
    case 'logout':
    case 'exit':
      return { kind: 'logout' }
    case 'goto':
    case 'cd': {
      const route = ROUTE_ALIASES[arg.toLowerCase().replace(/^[~/]+/, '')]
      return route
        ? { kind: 'goto', route }
        : { kind: 'error', message: `No screen called "${arg}". Try goto findings.` }
    }
    case 'open': {
      return /^fnd_\d+$/i.test(arg)
        ? { kind: 'open', id: arg.toLowerCase() }
        : { kind: 'error', message: 'Give a finding ID, for example open fnd_5231.' }
    }
    case 'scan':
      return arg ? { kind: 'scan', target: arg.replace(/^"|"$/g, '') } : { kind: 'goto', route: 'scans' }
    case 'export':
      return arg === '' || arg.toLowerCase() === 'csv'
        ? { kind: 'export' }
        : { kind: 'error', message: 'Only CSV export is available: export csv.' }
    case 'theme': {
      const mode = arg.toLowerCase()
      return mode === 'dark' || mode === 'light' || mode === 'system'
        ? { kind: 'theme', mode }
        : { kind: 'error', message: 'Use theme dark, theme light or theme system.' }
    }
    default:
      // A bare screen name also navigates ("targets"), which is what most people try first.
      if (!arg && ROUTE_ALIASES[verb] && !text.includes(':'))
        return { kind: 'goto', route: ROUTE_ALIASES[verb] }
      return { kind: 'query', text }
  }
}
