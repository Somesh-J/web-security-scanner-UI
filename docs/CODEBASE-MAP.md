# Codebase map

Discovery layer for the REDCELL console. Meaningful units only. Update in the same change as the code.

```text
src/
  → main.tsx — Boots the MSW worker (lazy chunk), then renders <App>
  → app/
    → App.tsx
      → App() — QueryClient + router + toaster, theme sync
      → AppRoutes() — All routes; modal-route drawer for /findings/:id
  → api/
    → client.ts
      → api() — Typed fetch: token, JSON, ApiError, latency metric
      → ApiError — Non-2xx response with status + server message
      → errorMessage() — Human message from any error
    → queries.ts
      → queryKeys — One key per resource
      → createQueryClient() — Retry only transport errors
      → useLogin / useTargets / useCreateTarget / useUpdateTarget / useDeleteTarget — Targets + auth (optimistic)
      → useScans() — Polls every 2 s while a scan is active
      → useCreateScan()
      → useFindings / useFinding / useSetFindingStatus — Findings + optimistic triage (single + bulk)
      → useReports / useCreateReport
  → components/
    → layout/
      → AppShell.tsx — Shell layout, global shortcuts (/, Ctrl+K, g-chords, Alt+1..6), scan-completion watcher
      → WindowBar.tsx — tmux-style window list (primary nav), theme toggle, account menu
      → StatusBar.tsx — Operator, live scans, API health, UTC clock
      → Logo.tsx — LogoMark
      → nav.ts — NAV_ITEMS (route, window name, g-shortcut)
    → ui/
      → Button.tsx — Button, ButtonLink ([ LABEL ] style), Spinner (| / - \)
      → buttonStyles.ts — buttonClass() variants/sizes, BRACKET
      → Tags.tsx — SeverityTag, StatusMark, EnvTag, SeverityStrip
      → severityStyles.ts — SEV_TEXT, SEV_FILL class maps
      → Field.tsx — TextField, SelectField, Switch ([ on]/[off]) with aria wiring
      → Dialog.tsx — Dialog, DialogBody, DialogFooter (Radix)
      → States.tsx — Skeleton, SkeletonRows, EmptyState, ErrorState, Kbd
      → Pagination.tsx — Page buttons + page size
      → ProgressRail.tsx — Scan progress bar + ASCII readout
      → PageHeader.tsx — PageHeader (VT323 title), Panel (TUI pane, title in border), PanelHeader
      → Toaster.tsx — Live-region toast stack
      → Icons.tsx — Stroke icon set
  → features/
    → auth/
      → LoginPage.tsx — Access gate, boot log, demo fill
      → RequireAuth.tsx — Route guard → /login?next=
    → dashboard/
      → DashboardPage.tsx — Readouts, charts, recent scans
      → Charts.tsx — SeverityBreakdown (stacked bar), SeverityTrend (30-day stacked columns)
      → stats.ts — openBySeverity(), findingsPerDay()
    → targets/
      → TargetsPage.tsx — Table, search, row actions, inline remove confirm
      → TargetFormDialog.tsx — Add/edit form, auth toggle reveals credentials
    → scans/
      → ScansPage.tsx — Status filter, scan table, live progress
      → NewScanDialog.tsx — Pick target, launch
      → ScanStatusMark.tsx — Glyph + label per scan status
    → findings/
      → query.ts — FindingsQuery; fromSearchParams/toSearchParams; parsePrompt/serializePrompt; normalisers
      → applyQuery.ts — applyQuery() filter→sort→paginate; sortFindings(); facetCounts()
      → useFindingsQuery.ts — URL-backed query hook, toggle()
      → FindingsPage.tsx — Centrepiece: filters, table, bulk bar, pagination, j/k keys
      → FilterBar.tsx — Search, chips with counts, status/category/target menus, saved views, CSV
      → FindingsTable.tsx — FindingsTable (desktop, sortable, selectable), FindingsCards (mobile)
      → BulkBar.tsx — Bulk status change
      → detail/
        → FindingDetail.tsx — What / where / proof / fix layout (shared)
        → FindingDetailPage.tsx — Full page at /findings/:id, DetailSkeleton
        → FindingDrawer.tsx — Inspector drawer, [ ] prev/next
        → StatusStepper.tsx — Triage radio group, 1–4 hotkeys
        → EvidencePanel.tsx — Request/response panes, copy, reveal secrets
        → evidence.ts — segmentLine() payload/impact/secret highlighting, redact()
    → reports/
      → ReportsPage.tsx — Reports table, GenerateReportDialog, PDF download
      → reportPdf.ts — reportToPdf()
    → settings/
      → SettingsPage.tsx — Profile, theme, CRT, API key, outage switch, reset data
    → prompt/
      → Prompt.tsx — Combobox prompt: commands + live findings filter
      → commands.ts — parseCommand(), COMMAND_HELP, ROUTES
      → suggest.ts — suggest() keys/values/commands
    → NotFoundPage.tsx
  → hooks/
    → useThemeSync.ts — Prefs → <html data-theme data-crt>
    → useNow.ts — Ticking clock
  → lib/
    → labels.ts — Severity/status/env labels, ranks, categoryCode(), isOpenStatus()
    → format.ts — formatUtc, formatDuration, formatRelative, asciiBar
    → schemas.ts — Zod: login, target form (create/edit), profile, API payloads
    → csv.ts — csvCell() (formula-injection safe), findingsToCsv()
    → pdf.ts — buildPdf() minimal PDF writer, wrap()
    → pagination.ts — pageWindow()
    → safeNext.ts — Same-site redirect guard
    → download.ts — downloadBlob()
    → focus.ts — focusOnMount() stable ref
    → demo.ts — DEMO_ACCOUNT, FAULT_KEY
  → mocks/
    → browser.ts — startMockApi() (setupWorker)
    → handlers.ts — createHandlers(): all /api routes, latency, fault injection, failing reports endpoint
    → db.ts — createDb(): time-based scan simulation, derived fields, sessionStorage persistence, ApiFailure
    → data/
      → seed.ts — createSeed(now): 8 targets, 12 scans, 48 findings, 4 reports
      → vulnerabilities.ts — VULNS catalogue (OWASP + CWE + raw HTTP evidence)
  → stores/
    → auth.ts — useAuthStore (session, persisted)
    → prefs.ts — usePrefsStore (theme, CRT, rail, saved views, history), resolveTheme()
    → toast.ts — useToastStore, toast.*
    → net.ts — useNetStore (last latency, API health)
  → styles/index.css — Theme tokens, Tailwind @theme mapping, keyframes, CRT mode
  → types/domain.ts — Contract types + enums
  → test/
    → setup.ts — jest-dom, matchMedia stub, storage reset
    → render.tsx — createTestServer() (MSW node), renderWithProviders()
    → integration.test.tsx — Login + Findings screen flows
public/
  → mockServiceWorker.js — MSW worker (generated)
.github/workflows/ci.yml — Typecheck, lint, format, test, build
vercel.json — SPA rewrite, build settings
```
