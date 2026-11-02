import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { LoginPage } from '@/features/auth/LoginPage'
import { FindingsPage } from '@/features/findings/FindingsPage'
import { DEMO_ACCOUNT } from '@/lib/demo'
import { useAuthStore } from '@/stores/auth'
import { createTestServer, renderWithProviders } from './render'

const { server } = createTestServer()

// Node's fetch needs absolute URLs; the app uses relative /api paths like a browser would.
const realFetch = globalThis.fetch
beforeAll(() => {
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    realFetch(typeof input === 'string' ? new URL(input, window.location.origin) : input, init)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ session: null })
})
afterAll(() => {
  server.close()
  globalThis.fetch = realFetch
})

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

describe('Login screen', () => {
  it('validates inline, rejects bad credentials, then signs in and follows ?next', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>,
      { route: '/login?next=%2Ffindings%3Fsev%3Dcritical' },
    )

    await user.click(screen.getByRole('button', { name: /authenticate/i }))
    expect(await screen.findByText('Enter your operator email.')).toBeInTheDocument()
    expect(screen.getByLabelText(/operator email/i)).toHaveAttribute('aria-invalid', 'true')

    await user.type(screen.getByLabelText(/operator email/i), DEMO_ACCOUNT.email)
    await user.type(screen.getByLabelText(/passphrase/i), 'wrong-passphrase')
    await user.click(screen.getByRole('button', { name: /authenticate/i }))
    expect(await screen.findByText(/ACCESS DENIED/)).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/passphrase/i))
    await user.type(screen.getByLabelText(/passphrase/i), DEMO_ACCOUNT.password)
    await user.click(screen.getByRole('button', { name: /authenticate/i }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/findings?sev=critical')
    expect(useAuthStore.getState().session?.token).toMatch(/^rc_/)
  })
})

describe('Findings screen', () => {
  it('combines URL filters, chip toggles, search and sorting', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route
          path="/findings"
          element={
            <>
              <FindingsPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>,
      { route: '/findings?sev=critical' },
    )

    const table = await screen.findByRole('table')
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(1))
    // Every data row is critical.
    const rows = () => within(table).getAllByRole('row').slice(1)
    expect(rows().every((r) => within(r).queryByText('Critical severity'))).toBe(true)

    // Add HIGH via its chip: the URL now carries both, and high rows appear.
    await user.click(screen.getByRole('button', { name: /^high severity/i }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('sev=critical%2Chigh'))
    expect(rows().some((r) => within(r).queryByText('High severity'))).toBe(true)

    // Search narrows within the active filters (debounced).
    await user.type(screen.getByLabelText(/search findings/i), 'xss')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('q=xss'))
    await waitFor(() => expect(rows()).toHaveLength(2))
    for (const r of rows()) expect(r).toHaveTextContent(/XSS/)

    // Sorting by title writes the sort to the URL and updates aria-sort.
    await user.click(screen.getByRole('button', { name: /^title/i }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('sort=title'))
    expect(screen.getByRole('columnheader', { name: /title/i })).toHaveAttribute('aria-sort', 'ascending')
    const titles = rows().map((r) => r.querySelector('a')?.textContent ?? '')
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)))
  })

  it('shows an empty state with a way out when nothing matches', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/findings" element={<FindingsPage />} />
      </Routes>,
      { route: '/findings?q=no-such-finding' },
    )
    expect(await screen.findByText(/0 findings match no-such-finding/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /clear filters/i }).length).toBeGreaterThan(0)
  })
})
