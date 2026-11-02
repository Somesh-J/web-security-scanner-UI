import { setupWorker } from 'msw/browser'
import { createHandlers } from './handlers'

/** Starts the Mock Service Worker. It intercepts /api/* at the network level, so app code uses plain fetch. */
export async function startMockApi() {
  const worker = setupWorker(...createHandlers())
  await worker.start({
    quiet: true,
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
