import type { SVGProps } from 'react'

/** Minimal stroke icon set (24px grid, 1.6 stroke), drawn for this console. Decorative: aria-hidden by default. */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      aria-hidden
      focusable="false"
      {...props}
    />
  )
}

export const IconDashboard = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z" />
  </Icon>
)
export const IconTarget = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
    <rect x="11" y="11" width="2" height="2" fill="currentColor" stroke="none" />
  </Icon>
)
export const IconScan = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M4 12h16" />
  </Icon>
)
export const IconFindings = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3 3 20h18L12 3z" />
    <path d="M12 10v4M12 16.5v.5" />
  </Icon>
)
export const IconReport = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M14 3v5h5M9 13h7M9 17h5" />
  </Icon>
)
export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <rect x="14" y="5" width="4" height="4" />
    <rect x="8" y="15" width="4" height="4" />
  </Icon>
)
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={14} height={14} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
export const IconPlay = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={12} height={12}>
    <path d="M7 5v14l11-7z" fill="currentColor" stroke="none" />
  </Icon>
)
export const IconDownload = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={14} height={14} strokeWidth={1.8}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icon>
)
export const IconMore = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={16} height={16}>
    <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} strokeLinecap="round" />
  </Icon>
)
export const IconSun = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={16} height={16}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
)
export const IconMoon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={16} height={16}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </Icon>
)
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={14} height={14}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
)
export const IconCopy = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={13} height={13}>
    <rect x="8" y="8" width="12" height="12" />
    <path d="M16 8V4H4v12h4" />
  </Icon>
)
export const IconExternal = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={12} height={12}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
  </Icon>
)
export const IconPin = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p} width={16} height={16}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
)
