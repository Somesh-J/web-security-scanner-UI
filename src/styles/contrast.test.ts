/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * WCAG 2.1 AA contrast check for every text-on-background token pair the components use, in both themes.
 * Values are read from index.css itself, so changing a token without re-checking contrast fails CI.
 * (Read from disk: Vitest runs with css: false, which turns CSS imports, even ?raw, into empty strings.)
 */

// Paths resolve from the project root, where Vitest runs.
const css = readFileSync('src/styles/index.css', 'utf8')

function themeVars(selector: string): Record<string, string> {
  const start = css.indexOf(selector)
  const block = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  const vars: Record<string, string> = {}
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) vars[m[1]!] = m[2]!.toLowerCase()
  return vars
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** [foreground token, background token] pairs as used by components (see Badges, Button, States ...). */
const PAIRS: [string, string][] = [
  // Body text on every surface
  ...['ink', 'ink-2', 'ink-3'].flatMap((fg) =>
    ['bg', 'surface', 'surface-2'].map((bg) => [fg, bg] as [string, string]),
  ),
  // Brand: links, active nav, current page, open-status badge, primary button
  ['brand-text', 'surface'],
  ['brand-text', 'bg'],
  ['brand-text', 'brand-soft'],
  ['brand-ink', 'brand'],
  ['brand', 'surface'],
  // Feedback
  ['success', 'success-soft'],
  ['success', 'surface'],
  ['danger', 'danger-soft'],
  ['danger', 'surface'],
  ['surface', 'danger'], // danger button label
  ['surface', 'ink'], // production badge, tooltips
  // Severity badges (soft tint) and severity text on cards
  ...['critical', 'high', 'medium', 'low', 'info'].flatMap((s) => [
    [`sev-${s}`, `sev-${s}-soft`] as [string, string],
    [`sev-${s}`, 'surface'] as [string, string],
  ]),
  // Evidence code panel
  ['code-ink', 'code-bg'],
  ['code-dim', 'code-bg'],
]

describe.each([
  ['light', ":root,\n[data-theme='light']"],
  ['dark', "[data-theme='dark']"],
])('%s theme contrast', (_name, selector) => {
  const vars = themeVars(selector)

  it.each(PAIRS)('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(vars[fg], `--${fg} missing`).toBeDefined()
    expect(vars[bg], `--${bg} missing`).toBeDefined()
    expect(contrast(vars[fg]!, vars[bg]!)).toBeGreaterThanOrEqual(4.5)
  })
})
