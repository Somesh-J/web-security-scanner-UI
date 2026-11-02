import { Circle, Diamond, Info, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { Severity } from '@/types/domain'

/** Severity icons and Tailwind class maps. Literal strings so Tailwind can see them. */

export const SEVERITY_ICON: Record<Severity, LucideIcon> = {
  critical: OctagonAlert,
  high: TriangleAlert,
  medium: Diamond,
  low: Circle,
  info: Info,
}

/** Tailwind classes per severity. Literal strings so Tailwind can see them. */
export const SEV_TEXT: Record<Severity, string> = {
  critical: 'text-sev-critical',
  high: 'text-sev-high',
  medium: 'text-sev-medium',
  low: 'text-sev-low',
  info: 'text-sev-info',
}

export const SEV_BADGE: Record<Severity, string> = {
  critical: 'bg-sev-critical-soft text-sev-critical',
  high: 'bg-sev-high-soft text-sev-high',
  medium: 'bg-sev-medium-soft text-sev-medium',
  low: 'bg-sev-low-soft text-sev-low',
  info: 'bg-sev-info-soft text-sev-info',
}

/** Non-text chart fills (bars, donut slices, legend dots). */
export const SEV_FILL: Record<Severity, string> = {
  critical: 'bg-chart-critical',
  high: 'bg-chart-high',
  medium: 'bg-chart-medium',
  low: 'bg-chart-low',
  info: 'bg-chart-info',
}

export const SEV_CHART_VAR: Record<Severity, string> = {
  critical: 'var(--chart-critical)',
  high: 'var(--chart-high)',
  medium: 'var(--chart-medium)',
  low: 'var(--chart-low)',
  info: 'var(--chart-info)',
}
