import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, type Location } from 'react-router-dom'
import { createQueryClient } from '@/api/queries'
import { AppShell } from '@/components/layout/AppShell'
import { SkeletonRows } from '@/components/ui/States'
import { Toaster } from '@/components/ui/Toaster'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { useThemeSync } from '@/hooks/useThemeSync'

// Route-level code splitting: each screen loads on first visit.
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const TargetsPage = lazy(() =>
  import('@/features/targets/TargetsPage').then((m) => ({ default: m.TargetsPage })),
)
const ScansPage = lazy(() => import('@/features/scans/ScansPage').then((m) => ({ default: m.ScansPage })))
const FindingsPage = lazy(() =>
  import('@/features/findings/FindingsPage').then((m) => ({ default: m.FindingsPage })),
)
const FindingDetailPage = lazy(() =>
  import('@/features/findings/detail/FindingDetailPage').then((m) => ({ default: m.FindingDetailPage })),
)
const FindingDrawer = lazy(() =>
  import('@/features/findings/detail/FindingDrawer').then((m) => ({ default: m.FindingDrawer })),
)
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const NotFoundPage = lazy(() => import('@/features/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-8">
      <SkeletonRows label="Loading page" rows={4} columns={['w-1/3', 'w-1/4', 'w-1/5']} />
    </div>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

export function AppRoutes() {
  const location = useLocation()
  // When a finding is opened from the table, render the table at the background location and the
  // finding as a drawer on top. A direct visit to /findings/:id has no background and gets the full page.
  const background = (location.state as { background?: Location } | null)?.background

  return (
    <>
      <Routes location={background ?? location}>
        <Route
          path="/login"
          element={
            <Lazy>
              <LoginPage />
            </Lazy>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Lazy>
                <DashboardPage />
              </Lazy>
            }
          />
          <Route
            path="targets"
            element={
              <Lazy>
                <TargetsPage />
              </Lazy>
            }
          />
          <Route
            path="scans"
            element={
              <Lazy>
                <ScansPage />
              </Lazy>
            }
          />
          <Route
            path="findings"
            element={
              <Lazy>
                <FindingsPage />
              </Lazy>
            }
          />
          <Route
            path="findings/:id"
            element={
              <Lazy>
                <FindingDetailPage />
              </Lazy>
            }
          />
          <Route
            path="reports"
            element={
              <Lazy>
                <ReportsPage />
              </Lazy>
            }
          />
          <Route
            path="settings"
            element={
              <Lazy>
                <SettingsPage />
              </Lazy>
            }
          />
          <Route
            path="*"
            element={
              <Lazy>
                <NotFoundPage />
              </Lazy>
            }
          />
        </Route>
      </Routes>
      {background && (
        <Routes>
          <Route
            path="/findings/:id"
            element={
              <RequireAuth>
                <Suspense fallback={null}>
                  <FindingDrawer />
                </Suspense>
              </RequireAuth>
            }
          />
        </Routes>
      )}
    </>
  )
}

export function App() {
  const [queryClient] = useState(createQueryClient)
  useThemeSync()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
