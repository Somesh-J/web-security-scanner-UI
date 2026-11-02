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

describe('Sign-in screen', () => {
  it('validates inline, rejects bad credentials, then signs in and follows ?next', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>,
      { route: '/login?next=%2Ffindings%3Fsev%3Dcritical' },
    )

    const submit = () => screen.getByRole('button', { name: /^sign in$/i })
    await user.click(submit())
    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('aria-invalid', 'true')

    await user.type(screen.getByLabelText(/^email$/i), DEMO_ACCOUNT.email)
    await user.type(screen.getByLabelText(/^password$/i), 'wrong-password')
    await user.click(submit())
    expect(await screen.findByText(/doesn.t match/i)).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/^password$/i))
    await user.type(screen.getByLabelText(/^password$/i), DEMO_ACCOUNT.password)
    await user.click(submit())
    expect(await screen.findByTestId('location')).toHaveTextContent('/findings?sev=critical')
    expect(useAuthStore.getState().session?.token).toMatch(/^cs_/)
  })

  it('signs in with one click using the demo account', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>,
      { route: '/login' },
    )
    await user.click(screen.getByRole('button', { name: /try the demo account/i }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/dashboard')
  })
})

describe('Issues screen', () => {
  it('combines URL filters, quick views, search and sorting', async () => {
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
      { route: '/findings?sev=critical,high' },
    )

    const table = await screen.findByRole('table')
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(1))
    const rows = () => within(table).getAllByRole('row').slice(1)
    // Every row is critical or high; severity is shown as a word, never colour alone.
    expect(rows().every((r) => within(r).queryByText(/^(Critical|High)$/))).toBe(true)

    // A quick view adds a status filter on top of the severity filter.
    await user.click(screen.getByRole('button', { name: /^needs attention/i }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('status=open%2Cconfirmed'))
    expect(screen.getByTestId('location')).toHaveTextContent('sev=critical%2Chigh')
    expect(rows().every((r) => within(r).queryByText(/^(New|Confirmed)$/))).toBe(true)

    // Search narrows within the active filters (debounced) and lands in the URL.
    await user.type(screen.getByLabelText(/search issues/i), 'injection')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('q=injection'))
    await waitFor(() => expect(rows().length).toBeGreaterThan(0))
    expect(screen.getByRole('button', { name: /remove filter: .*injection/i })).toBeInTheDocument()

    // Sorting by the Issue column writes the sort to the URL and updates aria-sort.
    await user.click(screen.getByRole('button', { name: /^issue/i }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('sort=title'))
    expect(screen.getByRole('columnheader', { name: /issue/i })).toHaveAttribute('aria-sort', 'ascending')
    const titles = rows().map((r) => r.querySelector('a')?.textContent ?? '')
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)))
  })

  it('shows a friendly empty state with a way out when nothing matches', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/findings" element={<FindingsPage />} />
      </Routes>,
      { route: '/findings?q=no-such-issue' },
    )
    expect(await screen.findByText('No issues match these filters')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /clear filters/i }).length).toBeGreaterThan(0)
  })
})
