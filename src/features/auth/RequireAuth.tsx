import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

/** Route guard: without a session token, redirect to /login and remember where the user was going. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.session?.token)
  const location = useLocation()
  if (!token) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  return <>{children}</>
}
