import { describe, expect, it } from 'vitest'
import { csvCell, findingsToCsv } from './csv'
import { asciiBar, formatDuration, formatRelative, formatUtc } from './format'
import { pageWindow } from './pagination'
import { buildPdf, wrap } from './pdf'
import { safeNext } from './safeNext'
import { createSeed } from '@/mocks/data/seed'

describe('csv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"')
  })

  it('neutralises spreadsheet formula injection (CWE-1236)', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('+1')).toBe("'+1")
    expect(csvCell('@sum')).toBe("'@sum")
  })

  it('exports findings with a header row and target names', () => {
    const seed = createSeed(Date.parse('2026-11-02T12:00:00Z'))
    const names = new Map(seed.targets.map((t) => [t.id, t.name]))
    const lines = findingsToCsv(seed.findings.slice(0, 2), names).split('\r\n')
    expect(lines[0]).toBe('id,title,severity,category,cwe,target,status,location,scan,discovered_at')
    expect(lines).toHaveLength(3)
  })
})

describe('safeNext (open redirect protection)', () => {
  it('allows same-site paths', () => {
    expect(safeNext('/findings?sev=critical')).toBe('/findings?sev=critical')
  })
  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeNext('https://evil.example')).toBe('/dashboard')
    expect(safeNext('//evil.example')).toBe('/dashboard')
    expect(safeNext('/\\evil.example')).toBe('/dashboard')
    expect(safeNext(null)).toBe('/dashboard')
  })
})

describe('format', () => {
  it('formats UTC timestamps and durations', () => {
    expect(formatUtc('2026-02-18T09:06:00Z')).toBe('2026-02-18 09:06Z')
    expect(formatUtc(null)).toBe('—')
    expect(formatDuration(742)).toBe('12:22')
    expect(formatDuration(3725)).toBe('1:02:05')
  })

  it('formats relative times', () => {
    const now = Date.parse('2026-11-02T12:00:00Z')
    expect(formatRelative('2026-11-02T11:57:00Z', now)).toBe('3m ago')
    expect(formatRelative('2026-11-02T09:00:00Z', now)).toBe('3h ago')
    expect(formatRelative('2026-10-30T12:00:00Z', now)).toBe('3d ago')
    expect(formatRelative(null, now)).toBe('never')
  })

  it('draws a fixed-width ASCII progress bar', () => {
    expect(asciiBar(0)).toBe('[............]')
    expect(asciiBar(50)).toBe('[######......]')
    expect(asciiBar(100)).toBe('[############]')
    expect(asciiBar(140)).toHaveLength(14)
  })
})

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5])
  })
  it('collapses distant pages into gaps', () => {
    expect(pageWindow(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12])
    expect(pageWindow(1, 12)).toEqual([1, 2, 'gap', 12])
  })
})

describe('pdf', () => {
  it('wraps text on word boundaries', () => {
    expect(wrap('one two three four', 9)).toEqual(['one two', 'three', 'four'])
  })

  it('writes a structurally valid PDF with correct xref offsets', () => {
    const bytes = buildPdf([{ text: 'Hello (world) – ünïcode' }], 'Test')
    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(text).toContain('(Hello \\(world\\) - ?n?code)')

    const startxref = Number(/startxref\n(\d+)/.exec(text)?.[1])
    expect(text.slice(startxref, startxref + 4)).toBe('xref')
    // Every xref entry must point at the start of its "N 0 obj" line.
    const entries = text.slice(startxref).split('\n').slice(3)
    entries
      .filter((l) => / 00000 n $/.test(l))
      .forEach((line, i) => {
        const offset = Number(line.slice(0, 10))
        expect(text.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`)
      })
  })

  it('paginates long content', () => {
    const lines = Array.from({ length: 120 }, (_, i) => ({ text: `line ${i}` }))
    const text = new TextDecoder().decode(buildPdf(lines, 'Long'))
    expect(Number(/\/Count (\d+)/.exec(text)?.[1])).toBeGreaterThan(1)
  })
})
