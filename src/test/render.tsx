import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { createQueryClient } from '@/api/queries'
import { createDb } from '@/mocks/db'
import { createHandlers } from '@/mocks/handlers'

/**
 * Integration-test harness: the real MSW handlers and mock database, with no latency,
 * so components are tested against the same network contract the browser uses.
 */
export function createTestServer() {
  const db = createDb({ storage: null, now: () => Date.parse('2026-11-02T12:00:00Z') })
  const server = setupServer(...createHandlers({ db, latency: () => 0, failReportsOnce: false }))
  return { db, server }
}

export function renderWithProviders(ui: ReactNode, { route = '/' }: { route?: string } = {}) {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
