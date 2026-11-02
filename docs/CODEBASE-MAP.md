# Codebase map

Discovery layer for Clearsite. Meaningful units only. Update in the same change as the code.

```text
src/
  → main.tsx — Boots the MSW worker (lazy chunk), then renders <App>
  → app/
    → App.tsx
      → App() — QueryClient + router + toaster, theme sync
      → AppRoutes() — All routes; modal-route side panel for /findings/:id
  → api/
    → client.ts
      → api() — Typed fetch: token, JSON, ApiError
      → ApiError — Non-2xx response with status + server message
      → errorMessage() — Human message from any error
    → queries.ts
      → queryKeys — One key per resource
      → isTransient() — Network drop or 503: safe to retry automatically
      → createQueryClient() — Retries transient errors with backoff only
      → useLogin / useTargets / useCreateTarget / useUpdateTarget / useDeleteTarget — Websites + auth (optimistic)
      → useScans() — Polls every 2 s while a scan is active
      → useCreateScan()
      → useFindings / useFinding / useSetFindingStatus — Issues + optimistic triage (single + bulk)
      → useReports / useCreateReport
    → reportsRetry.test.ts — Regression: first-load 503 on /api/reports recovers; 500 outage still errors
  → components/
    → layout/
      → AppShell.tsx — Sidebar + top bar + outlet, Ctrl/⌘K, global New scan dialog, scan-finished toast
      → Sidebar.tsx — Desktop nav (icon + label), counts, theme toggle, collapse
      → TopBar.tsx — Search button (opens palette), New scan, account menu
      → MobileTabBar.tsx — Bottom tab bar under 768 px
      → CommandPalette.tsx — Quick finder: pages, actions, issues, websites (secondary to visible nav)
      → Logo.tsx — LogoMark, Logo (wordmark)
      → nav.ts — NAV_ITEMS, SETTINGS_ITEM
    → ui/
      → Button.tsx — Button, ButtonLink, IconButton, Spinner
      → buttonStyles.ts — buttonClass() variants/sizes
      → Badges.tsx — SeverityBadge, StatusBadge, EnvBadge, SeverityCounts
      → severityStyles.ts — SEVERITY_ICON, SEV_TEXT/SEV_BADGE/SEV_FILL/SEV_CHART_VAR
      → Field.tsx — TextField, SelectField, Switch with aria wiring
      → Dialog.tsx — Dialog, DialogBody, DialogFooter (Radix)
      → Help.tsx — HelpPopover ("What's this?"), Tip, TooltipProvider
      → PageHeader.tsx — PageHeader (sets tab title), Page container, Card
      → States.tsx — Skeleton, SkeletonRows, EmptyState, ErrorState, Kbd
      → Pagination.tsx — Page buttons + page size
      → ProgressBar.tsx — Scan progress bar
      → Toaster.tsx — Live-region toast stack with optional action (Undo, Review)
  → features/
    → auth/
      → LoginPage.tsx — Sign in, product snippet, one-click demo account
      → RequireAuth.tsx — Route guard → /login?next=
    → dashboard/
      → DashboardPage.tsx — Data-sentence headline, stat strip, Fix first, charts, recent scans
      → GetStartedChecklist.tsx — 4 setup steps from real data; hidden when done or dismissed
      → Charts.tsx — SeverityDonut, IssuesOverTime (30-day stacked columns)
      → stats.ts — openBySeverity(), findingsPerDay(), openSince(), checklistSteps()
    → targets/
      → TargetsPage.tsx — Websites table/cards, search, env filter, Scan, edit/remove, ?add=1
      → TargetFormDialog.tsx — Add/edit form, login toggle reveals credentials
    → scans/
      → ScansPage.tsx — Status tabs, scan table, live progress, retry failed
      → NewScanDialog.tsx — Pick a website, start a scan (one global instance)
      → ScanStatusBadge.tsx — Icon + word per scan status
    → findings/
      → query.ts — FindingsQuery; fromSearchParams/toSearchParams; normalisers
      → applyQuery.ts — applyQuery() filter→sort→paginate; sortFindings(); facetCounts()
      → useFindingsQuery.ts — URL-backed query hook, toggle()
      → FindingsPage.tsx — Issues: quick views, filters, table, bulk bar, pagination, j/k keys
      → FilterBar.tsx — QuickViews, FilterBar (search, filter menus with counts, pills, saved views, CSV)
      → FindingsTable.tsx — FindingsTable (desktop, sortable, selectable), FindingsCards (mobile)
      → BulkBar.tsx — Floating bulk status change
      → detail/
        → FindingDetail.tsx — What's wrong → Proof (collapsed) → How to fix, details card
        → FindingDetailPage.tsx — Full page at /findings/:id, DetailSkeleton
        → FindingDrawer.tsx — Side panel, prev/next
        → StatusStepper.tsx — Status radio group with helper text, 1–4 hotkeys in panel
        → EvidencePanel.tsx — Request/response panes, copy, show secrets
        → evidence.ts — segmentLine() payload/impact/secret highlighting, redact()
    → reports/
      → ReportsPage.tsx — Reports list, Create report dialog, PDF download, ?create=1
      → reportPdf.ts — reportToPdf()
    → settings/
      → SettingsPage.tsx — Profile, appearance, API key placeholder, demo tools
    → NotFoundPage.tsx
  → hooks/
    → useThemeSync.ts — Prefs → <html data-theme>
    → useDocumentTitle.ts — "<page> · Clearsite" tab titles, PRODUCT_NAME
    → useNow.ts — Ticking clock for relative times
  → lib/
    → labels.ts — Friendly severity/status/env labels + help text, JARGON explanations, ranks
    → format.ts — formatUtc, formatDuration, formatRelative, pluralize
    → schemas.ts — Zod: login, website form (create/edit), profile, API payloads
    → csv.ts — csvCell() (formula-injection safe), findingsToCsv()
    → pdf.ts — buildPdf() minimal PDF writer, wrap()
    → pagination.ts — pageWindow()
    → safeNext.ts — Same-site redirect guard
    → download.ts — downloadBlob()
    → focus.ts — focusOnMount() stable ref
    → demo.ts — DEMO_ACCOUNT, FAULT_KEY
  → mocks/
    → browser.ts — startMockApi() (setupWorker)
    → handlers.ts — createHandlers(): all /api routes, latency, fault injection, first-request 503 on reports
    → db.ts — createDb(): time-based scan simulation, derived fields, sessionStorage persistence, ApiFailure
    → data/
      → seed.ts — createSeed(now): 8 websites, 12 scans, 48 issues, 4 reports
      → vulnerabilities.ts — VULNS catalogue (OWASP + CWE + raw HTTP evidence)
  → stores/
    → auth.ts — useAuthStore (session, persisted)
    → prefs.ts — usePrefsStore (theme, sidebar, checklist dismissed, saved views), resolveTheme()
    → ui.ts — useUiStore (global New scan dialog, palette open)
    → toast.ts — useToastStore, toast.* with optional action
  → styles/
    → index.css — Theme tokens (light/dark), Tailwind @theme mapping, fonts, keyframes
    → contrast.test.ts — WCAG AA check of every token pair in both themes
  → types/domain.ts — Contract types + enums
  → test/
    → setup.ts — jest-dom, matchMedia stub, storage reset
    → render.tsx — createTestServer() (MSW node), renderWithProviders()
    → integration.test.tsx — Sign-in + Issues screen flows
public/
  → mockServiceWorker.js — MSW worker (generated)
  → favicon.svg — Clearsite mark
.github/workflows/ci.yml — Typecheck, lint, format, test, build
vercel.json — SPA rewrite, build settings
docs/
  → DESIGN-v2.md — Current design system and decisions
  → DESIGN.md — v1 terminal direction (superseded)
```
