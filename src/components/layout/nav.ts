import type { ComponentType, SVGProps } from 'react'
import {
  IconDashboard,
  IconFindings,
  IconReport,
  IconScan,
  IconSettings,
  IconTarget,
} from '@/components/ui/Icons'

export interface NavItem {
  to: string
  label: string
  /** Single-key shortcut shown in the rail tooltip: g then this key. */
  key: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

/** Order follows the analyst workflow: overview, add target, scan, triage findings, report. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', key: 'd', icon: IconDashboard },
  { to: '/targets', label: 'Targets', key: 't', icon: IconTarget },
  { to: '/scans', label: 'Scans', key: 's', icon: IconScan },
  { to: '/findings', label: 'Findings', key: 'f', icon: IconFindings },
  { to: '/reports', label: 'Reports', key: 'r', icon: IconReport },
  { to: '/settings', label: 'Settings', key: 'c', icon: IconSettings },
]
