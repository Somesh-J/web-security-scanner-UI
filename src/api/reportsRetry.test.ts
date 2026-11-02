import type { QueryClient } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { FAULT_KEY } from '@/lib/demo'
import { createDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'
import type { Report } from '@/types/domain'
import { api, ApiError } from './client'
import { createQueryClient, isTransient, queryKeys } from './queries'

/**
 * Regression: GET /api/reports deliberately fails its first request with a 503 (the brief's
 * "failing endpoint"). Users used to see "ERR 503 /api/reports" on every visit. The query client now
 * treats 503 as transient and retries, so the list loads; a real outage (500) still surfaces.
 */

const db = createDb({ storage: null, now: () => Date.parse('2026-11-02T12:00:00Z') })
const server = setupServer(...createHandlers({ db, latency: () => 0, failReportsOnce: true }))

const realFetch = globalThis.fetch
beforeAll(() => {
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    realFetch(typeof input === 'string' ? new URL(input, window.location.origin) : input, init)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => localStorage.removeItem(FAULT_KEY))
afterAll(() => {
  server.close()
  globalThis.fetch = realFetch
})

function fetchReports(qc: QueryClient) {
  return qc.fetchQuery({ queryKey: queryKeys.reports, queryFn: () => api<Report[]>('/api/reports') })
}

describe('reports endpoint failure handling', () => {
  it('classifies only network drops and 503s as transient', () => {
    expect(isTransient(new ApiError(0, 'offline', '/x'))).toBe(true)
    expect(isTransient(new ApiError(503, 'busy', '/x'))).toBe(true)
    expect(isTransient(new ApiError(500, 'down', '/x'))).toBe(false)
    expect(isTransient(new ApiError(404, 'missing', '/x'))).toBe(false)
    expect(isTransient(new Error('other'))).toBe(false)
  })

  it('recovers from the deliberate first 503 without the user seeing an error', async () => {
    const qc = createQueryClient()
    // fetchQuery ignores the default retry; mirror what useQuery does with the client's defaults.
    qc.setQueryDefaults(queryKeys.reports, { retry: qc.getDefaultOptions().queries?.retry, retryDelay: 1 })
    const reports = await fetchReports(qc)
    expect(reports.length).toBeGreaterThan(0)
  })

  it('still shows the error state for a real outage (500 is not retried)', async () => {
    localStorage.setItem(FAULT_KEY, 'on')
    const qc = createQueryClient()
    qc.setQueryDefaults(queryKeys.reports, { retry: qc.getDefaultOptions().queries?.retry, retryDelay: 1 })
    await expect(fetchReports(qc)).rejects.toMatchObject({ status: 500 })
  })
})
