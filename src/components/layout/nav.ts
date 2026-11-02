export interface NavItem {
  to: string
  /** tmux-style window name. */
  label: string
  /** Second key of the `g` chord (g d, g t ...). */
  key: string
}

/** Window order follows the analyst workflow: overview, add target, scan, triage, report, configure. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'dashboard', key: 'd' },
  { to: '/targets', label: 'targets', key: 't' },
  { to: '/scans', label: 'scans', key: 's' },
  { to: '/findings', label: 'findings', key: 'f' },
  { to: '/reports', label: 'reports', key: 'r' },
  { to: '/settings', label: 'settings', key: 'c' },
]
