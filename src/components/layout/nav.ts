import {
  FileText,
  Globe,
  LayoutDashboard,
  Radar,
  Settings,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** One-line purpose, shown in the command palette. */
  hint: string
}

/** Order follows the user's workflow: overview, add a website, scan it, review issues, share a report. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, hint: 'How your websites are doing' },
  { to: '/targets', label: 'Websites & APIs', icon: Globe, hint: 'The sites you scan' },
  { to: '/scans', label: 'Scans', icon: Radar, hint: 'Start and follow scans' },
  { to: '/findings', label: 'Issues', icon: TriangleAlert, hint: 'Problems found, and how to fix them' },
  { to: '/reports', label: 'Reports', icon: FileText, hint: 'PDF summaries to share' },
]

export const SETTINGS_ITEM: NavItem = {
  to: '/settings',
  label: 'Settings',
  icon: Settings,
  hint: 'Profile, appearance and API key',
}
