# REDCELL — Web Security Scanning Console

A frontend for security analysts to add targets, run scans, triage findings and export reports.
Built for the Frontend Intern assignment against a mock backend.

**Live:** https://web-security-scanner-ui.vercel.app
**Demo account:** `op@redcell.io` / `redteam-2026` (there is also a "Fill demo credentials" button)

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                            | What it does                                                           |
| --------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                     | Vite dev server with the mock API                                      |
| `npm run build`                   | Type-check (`tsc -b`) and production build to `dist/`                  |
| `npm run preview`                 | Serve the production build                                             |
| `npm run test`                    | Vitest: unit + integration tests                                       |
| `npm run lint`                    | ESLint (TypeScript type-aware rules + jsx-a11y), zero warnings allowed |
| `npm run format` / `format:check` | Prettier                                                               |
| `npm run check`                   | Typecheck, lint, format check and tests: what CI runs                  |

Requires Node 20+.

## A two-minute tour

1. Sign in. A wrong passphrase shows **ACCESS DENIED**; the demo account gets you in.
2. **Dashboard**: every number and chart segment is a link into a filtered findings view.
3. **Targets → Add target**: try submitting empty to see inline validation; turn on _Authenticated scan_ to reveal credentials.
4. **Scans → New scan** (or type `scan payments` in the prompt): watch it go queued → running → done. When it completes, new findings appear and a toast tells you.
5. **Findings**: filter with chips, the search box, or type in the prompt at the bottom, e.g. `sev:crit,high status:open sql`. Click a row for the inspector drawer. Press `1`–`4` to triage.
6. **Reports**: the first load fails on purpose (the "failing endpoint"). Press Retry, then download a real PDF.
7. **Settings**: switch theme (persists), and turn on _Simulate API outage_ to see every screen's error state.

Keyboard: `/` or `Ctrl/⌘+K` focus the prompt · `Alt+1`…`Alt+6` or `g` then `d t s f r c` switch windows · on findings `j`/`k` move, `Enter` open, `x` select · in the drawer `[` `]` previous/next, `1`–`4` set status, `Esc` close.

## Stack and why

| Area                 | Choice                                                                  | Why                                                                                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework            | React 18.3 + TypeScript 5.9 (strict, `noUncheckedIndexedAccess`) + Vite | Required. Vite's template now ships React 19, so React 18 is pinned explicitly.                                                                                                                                                                             |
| Styling              | Tailwind CSS 4 + a CSS-variable token layer                             | Tokens live in `src/styles/index.css` per theme; Tailwind maps them to utilities (`bg-panel`, `text-ash`). A theme switch is one attribute on `<html>`.                                                                                                     |
| Routing              | React Router 6                                                          | Real URL per screen. Findings filters, sort and page live in the URL, so every view is shareable and Back works. `/findings/:id` uses the _modal route_ pattern: drawer over the table when opened from the table, full page on direct visit.               |
| Server state         | **TanStack Query**                                                      | Loading/error/retry states, caching, polling (`refetchInterval` while a scan is running) and **optimistic updates with rollback** for triage and target edits. This is the part of the app that talks to a backend, so it gets a real server-state library. |
| Client state         | **Zustand** (`persist`)                                                 | Small, typed stores for what is not server data: session token, theme, CRT mode, saved views, prompt history, toasts. No provider boilerplate.                                                                                                              |
| Why not Context only |                                                                         | Context re-renders every consumer on any change and has no caching or request de-duplication; we would rebuild half of TanStack Query by hand.                                                                                                              |
| Mock API             | **MSW 3** (Mock Service Worker)                                         | Intercepts `fetch` at the network level, so app code is the code that will run against the real backend. The same handlers run in the browser (service worker) and in Node for integration tests.                                                           |
| Forms                | React Hook Form + Zod                                                   | One Zod schema per form, **shared by the form and the mock API**, so client and "server" validation cannot disagree.                                                                                                                                        |
| Headless primitives  | Radix Dialog, DropdownMenu, Switch                                      | Permitted by the brief. Focus trapping, Esc, ARIA roles and keyboard support for free. All visuals are our own.                                                                                                                                             |
| Charts               | Hand-rolled SVG                                                         | Two charts did not justify a chart library. They use the same CSS tokens, so they theme automatically, and each has an accessible data table.                                                                                                               |
| Tests                | Vitest + Testing Library + MSW node                                     | Unit tests for every pure module, integration tests that render real screens against the real handlers.                                                                                                                                                     |

## Architecture

```
Browser
  └─ React screens (src/features/*)
       ├─ read/write URL state (findings query, scan filter)
       ├─ TanStack Query hooks (src/api/queries.ts)
       │     └─ api() fetch wrapper (src/api/client.ts): token, JSON, ApiError, latency metric
       │            └─ fetch('/api/...')  ── intercepted by ──▶ MSW handlers (src/mocks/handlers.ts)
       │                                                         ├─ 300–800 ms latency, fault injection
       │                                                         └─ mock DB (src/mocks/db.ts) ── sessionStorage
       └─ Zustand stores (src/stores/*): session, prefs, toasts, network health
```

**The findings engine** is the core of the centrepiece screen. One typed `FindingsQuery` holds text, severity, status, category, CWE, target, scan, multi-key sort and page. Three pure, unit-tested functions keep three views of it in sync:

```
URL search params  ⇄  FindingsQuery  ⇄  prompt text ("sev:crit status:open sql")
                            │
                 applyQuery(findings, query) → filter → sort → paginate   (memoised)
                 facetCounts(findings, query) → per-chip counts
```

**The mock backend is time-based.** Scans store timestamps, and progress is computed on each read, so a running scan keeps advancing across reloads with no timers. When a simulated scan completes, it "discovers" new findings. Derived fields (`openFindings`, `lastScannedAt`, `findingsCount`) are computed on read, never stored, so they cannot drift.

A full map of files and responsibilities is in [`docs/CODEBASE-MAP.md`](docs/CODEBASE-MAP.md). The visual design rationale is in [`docs/DESIGN.md`](docs/DESIGN.md).

## Requirements checklist

| Requirement (brief)                                                                                                        | Where / how                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7 screens, real URLs, protected behind login                                                                               | `/login /dashboard /targets /scans /findings /findings/:id /reports /settings`; `RequireAuth` redirects with `?next=` (same-site only, so it is not an open redirect) |
| Login: validation, bad-credential error, fake token                                                                        | Zod + inline errors; 401 → "ACCESS DENIED"; token in persisted auth store                                                                                             |
| Dashboard: totals, severity breakdown, ≥2 charts, recent scans, stats link to filtered views                               | 4 readouts, stacked severity bar, 30-day severity trend, recent operations; every number links                                                                        |
| Targets: table, add modal, validated form, auth toggle reveals credentials, edit, remove                                   | `TargetsPage`, `TargetFormDialog`; inline remove confirmation; optimistic updates                                                                                     |
| Scans: statuses, target, start, duration, findings count, New scan, animated progress on a timer, completed opens findings | `ScansPage`; 2 s polling of a time-based simulation; ASCII + bar progress; row → `/findings?scan=…`                                                                   |
| Findings: search, severity/category/status filters, sort any column, pagination, all combinable, row → detail              | `FindingsPage` + `applyQuery`; plus target filter, multi-sort (Shift-click), page size                                                                                |
| Finding detail: everything in the brief + status control                                                                   | `FindingDetail`; evidence panel with payload/impact highlighting and secret redaction; stepper open → confirmed → resolved / false positive                           |
| Reports: list, Download PDF, Generate from a scan                                                                          | Real one-page PDF built client-side (`lib/pdf.ts`); generate dialog lists completed scans                                                                             |
| Settings: profile, persistent theme toggle, API key field                                                                  | Validated profile, Ops/Dossier/System theme (applied before first paint), masked key with copy/regenerate                                                             |
| Every list has loading, empty and error states                                                                             | Shared `SkeletonRows`, `EmptyState`, `ErrorState`; Settings → _Simulate API outage_ shows them all                                                                    |
| Mock API: 300–800 ms latency, ≥1 failing endpoint                                                                          | Random latency in every handler; `GET /api/reports` fails on its first request each page load; outage switch fails every GET                                          |
| Status changes persist for the session                                                                                     | Mock DB is saved to `sessionStorage`; optimistic cache update in the UI                                                                                               |
| ≥6 targets, ≥10 scans, ≥40 findings, OWASP labels, real CWEs                                                               | 8 targets, 12 scans, 48 findings across all 5 severities and all 10 OWASP 2021 categories (asserted by tests)                                                         |

**Stretch goals done:** bulk actions, saved filter views, CSV export (with formula-injection protection), command palette (the prompt), severity trend over time, skeleton loaders, unit tests on filter logic, narrow/mobile layout.

## Accessibility

- Severity and status are **never colour alone**: severity is a text tag (`[CRIT]`), status is glyph + word.
- Every text colour token is ≥ 4.5:1 on every surface in both themes (checked when the palette was designed).
- Visible 2 px focus ring everywhere; skip link; landmarks (`nav`, `header`, `main`, `footer`); table captions; `aria-sort` on sortable headers.
- Dialogs and the drawer trap focus and close on Esc (Radix). The status stepper is a radio group with arrow keys.
- The prompt is an ARIA combobox; result counts are announced in a live region.
- `prefers-reduced-motion` turns off every animation, including the count-up and the boot log.
- `eslint-plugin-jsx-a11y` runs in CI with zero warnings allowed.

## Performance

- The findings pipeline is a pure function memoised on `(data, query)`; the table is `React.memo` and only re-renders when rows, sort or selection change.
- Search input is debounced (200 ms); prompt live-filtering is debounced (250 ms).
- Pagination (10/20/50) rather than virtualisation: with tens of rows, pagination is simpler and keeps keyboard navigation predictable. `applyQuery` already returns the full matched list, so a virtual list could be swapped in.
- Each screen is a lazy-loaded chunk. The mock layer is a separate chunk, so the app entry is ~171 kB (54 kB gzip).
- Scan polling only runs while a scan is queued or running.

## Testing

`npm run test` runs 59 tests:

- **Query engine:** URL ⇄ query round-trip, prompt parsing (aliases, quoting, invalid tokens), filter/sort/paginate combinations, facet counts.
- **Prompt commands**, **mock database** (scan lifecycle over simulated time, cascade delete, validation), **dashboard aggregations**, **evidence highlighting**, **CSV**, **PDF structure (xref offsets)**, **safe redirect**.
- **Integration:** the Login screen (inline validation → 401 → success → redirect) and the Findings screen (URL filter + chip + search + sort, empty state), rendered against the real MSW handlers in Node.

CI (`.github/workflows/ci.yml`) runs typecheck, lint, format check, tests and build on every push.

## Assumptions

- Authentication is simulated: only the demo account is accepted, which lets the "bad credentials" error be demonstrated. The token is random and stored in `localStorage`.
- The mock backend runs in the browser in production too (there is no real backend yet). Its data lives in `sessionStorage`, so it resets when the tab closes. **Settings → Reset demo data** resets it on demand.
- Seed timestamps are relative to "now", so the dashboard always shows a realistic last 30 days.
- `findingsCount` on a scan follows the contract and omits `info`; info findings are still listed and filterable.
- Removing a target also removes its scans and findings (the confirmation says so). Reports are snapshots and are kept.
- Target credentials are sent on create/update but never returned or displayed; the mock stores only the username.
- Filtering happens client-side because the contract's `GET /api/findings` returns the full list. `FindingsQuery` serialises to URL params, so moving it to server-side query parameters later is a small change.

## Known gaps

- No real authentication, authorisation or session expiry.
- No end-to-end browser tests (Playwright); coverage is unit + component integration.
- Saved views and prompt history are per-browser (localStorage), not per-account.
- The PDF is a plain monospace layout without charts.
- Bulk actions apply one status to all selected rows; there is no undo beyond changing the status back.

## Project structure

```
src/
  api/          fetch client + TanStack Query hooks
  app/          App, routes, providers
  components/   layout shell (rail, context bar, status bar) and UI primitives
  features/     one folder per screen: auth, dashboard, targets, scans, findings, reports, settings, prompt
  hooks/        theme sync, clock
  lib/          pure helpers: labels, format, schemas, csv, pdf, pagination, safeNext
  mocks/        MSW handlers, mock DB, seed data and vulnerability catalogue
  stores/       Zustand stores
  styles/       design tokens + Tailwind entry
  types/        domain types that mirror the data contract
```
