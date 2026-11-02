import { useAuthStore } from '@/stores/auth'

/** Error thrown for any non-2xx response. `message` is the server's human-readable explanation. */
export class ApiError extends Error {
  readonly status: number
  readonly path: string

  constructor(status: number, message: string, path: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.path = path
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

/**
 * Thin typed wrapper over fetch. It adds the bearer token, parses JSON, and turns failures into ApiError
 * so every screen can show the same kind of error message.
 */
export async function api<T>(path: string, init: { method?: Method; body?: unknown } = {}): Promise<T> {
  const token = useAuthStore.getState().session?.token
  let response: Response
  try {
    response = await fetch(path, {
      method: init.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch (e) {
    // A cancelled request is not an API failure; let TanStack Query handle the abort.
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError(0, 'The network request failed. Check your connection and try again.', path)
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`
    try {
      const data = (await response.json()) as { message?: string }
      if (data.message) message = data.message
    } catch {
      // Body was not JSON; keep the generic message.
    }
    throw new ApiError(response.status, message, path)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
