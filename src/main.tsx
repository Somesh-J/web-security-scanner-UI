import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/styles/index.css'

/**
 * The mock API must be running before the first request, so the app renders only after the
 * service worker is active. In production it is the same mock: there is no real backend yet.
 */
async function boot() {
  // Loaded as its own chunk: the mock layer (MSW + seed data) stays out of the app bundle.
  const { startMockApi } = await import('@/mocks/browser')
  await startMockApi()
  const root = document.getElementById('root')
  if (!root) throw new Error('Missing #root element')
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
