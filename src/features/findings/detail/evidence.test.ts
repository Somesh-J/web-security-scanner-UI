import { describe, expect, it } from 'vitest'
import { redact, segmentLine } from './evidence'

describe('evidence highlighting', () => {
  it('marks the injected payload in a request line', () => {
    const segs = segmentLine('GET /search?q=test%27 HTTP/1.1', 'request')
    expect(segs.find((s) => s.kind === 'payload')?.text).toBe('%27')
  })

  it('marks proof of impact in a response line', () => {
    const segs = segmentLine('You have an error in your SQL syntax; check the manual', 'response')
    expect(segs[0]).toEqual({ kind: 'leak', text: 'You have an error in your SQL syntax;' })
  })

  it('treats cookies and bearer tokens as secrets', () => {
    const cookie = segmentLine('Cookie: session=8f2c1e0b9a7d4f6e', 'request')
    expect(cookie.map((s) => s.kind)).toEqual(['header', 'text', 'secret'])
    const bearer = segmentLine('Authorization: Bearer abc.def.ghi', 'request')
    expect(bearer.at(-1)).toEqual({ kind: 'secret', text: 'abc.def.ghi' })
  })

  it('reassembles to the original text', () => {
    const line = 'Host: shop.example.com'
    expect(
      segmentLine(line, 'request')
        .map((s) => s.text)
        .join(''),
    ).toBe(line)
  })

  it('redacts without revealing length exactly', () => {
    expect(redact('x')).toBe('██████')
    expect(redact('a'.repeat(300))).toHaveLength(16)
  })
})
