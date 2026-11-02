const pad = (n: number) => String(n).padStart(2, '0')

/** 2026-02-18 09:06Z. UTC on purpose: operators across time zones read the same timestamp. */
export function formatUtc(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}Z`
}

/** 02-18 09:06 — compact form for dense tables. */
export function formatUtcShort(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** 742 -> "12:22", 3725 -> "1:02:05" */
export function formatDuration(sec: number | null): string {
  if (sec === null) return '—'
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`
}

/** "3m ago", "2h ago", "4d ago". `now` is injectable for tests. */
export function formatRelative(iso: string | null, now: number = Date.now()): string {
  if (!iso) return 'never'
  const diff = Math.max(0, now - new Date(iso).getTime())
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return formatUtc(iso).slice(0, 10)
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** "[#######.....]" — the nmap-style text readout that sits beside the real bar. */
export function asciiBar(progress: number, width = 12): string {
  const filled = Math.round((Math.min(100, Math.max(0, progress)) / 100) * width)
  return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}]`
}
