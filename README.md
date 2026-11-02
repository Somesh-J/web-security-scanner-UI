# Clearsite: website security, explained

A frontend for scanning websites and APIs for security issues, reviewing what was found, and fixing it. Built for the Frontend Intern assignment against a mock backend. Designed so someone with no security background can add a website, start a scan, understand the results and know how to fix each issue.

**Live:** https://web-security-scanner-ui.vercel.app
**Demo account:** `demo@clearsite.app` / `clearsite-demo-2026` (or press **Try the demo account** on the sign-in page)

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

1. **Sign in.** A wrong password shows an inline error; **Try the demo account** signs you in with one click.
2. **Overview.** The headline is built from your data ("36 open issues on 7 websites. 5 need fixing today."). Every number links to the matching filtered list. **Fix first** lists the five most urgent issues. New accounts see a four-step setup checklist that disappears once done.
3. **Websites & APIs, then Add website.** Submit it empty to see inline validation. Turn on _This site needs a login to scan_ to reveal the credential fields.
4. **New scan** (top bar, or **Scan** on a website row). Watch it go queued, running, completed with live progress. When it finishes, a toast links straight to the issues it found.
5. **Issues.** Search, filter by severity, category, status and website, sort any column, page through. All of it is in the URL. Quick views (Needs attention, Fixed, Not an issue) are one click. Click a row to open the side panel.
6. **Issue detail.** Reads in order: what's wrong, the proof (collapsed by default, with a plain explanation of why it matters), and how to fix it. Change the status; **Undo** is in the toast.
7. **Reports.** Create a report from a finished scan and download a real PDF.
8. **Settings.** Light, dark or match-your-system theme (persists). Turn on _Simulate a server outage_ to see every screen's error state.

Search and quick actions: the search box in the top bar, or Ctrl/Cmd+K. On Issues, `j`/`k` move, `Enter` opens, `x` selects; in the side panel `[` `]` go to the previous/next issue and `1` to `4` set the status.

## Stack and why

| Area                 | Choice                                                                  | Why                                                                                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework            | React 18.3 + TypeScript 5.9 (strict, `noUncheckedIndexedAccess`) + Vite | Required. Vite's template now ships React 19, so React 18 is pinned explicitly.                                                                                                                                                                             |
| Styling              | Tailwind CSS 4 + a CSS-variable token layer                             | Tokens live in `src/styles/index.css` per theme; Tailwind maps them to utilities (`bg-surface`, `text-ink-2`). A theme switch is one attribute on `<html>`. A test checks every text/background token pair for WCAG AA contrast.                            |
| Routing              | React Router 6                                                          | Real URL per screen. Findings filters, sort and page live in the URL, so every view is shareable and Back works. `/findings/:id` uses the _modal route_ pattern: drawer over the table when opened from the table, full page on direct visit.               |
| Server state         | **TanStack Query**                                                      | Loading/error/retry states, caching, polling (`refetchInterval` while a scan is running) and **optimistic updates with rollback** for triage and target edits. This is the part of the app that talks to a backend, so it gets a real server-state library. |
| Client state         | **Zustand** (`persist`)                                                 | Small, typed stores for what is not server data: session token, theme, sidebar state, saved views, toasts, the global New scan dialog. No provider boilerplate.                                                                                             |
| Why not Context only |                                                                         | Context re-renders every consumer on any change and has no caching or request de-duplication; we would rebuild half of TanStack Query by hand.                                                                                                              |
| Mock API             | **MSW 3** (Mock Service Worker)                                         | Intercepts `fetch` at the network level, so app code is the code that will run against the real backend. The same handlers run in the browser (service worker) and in Node for integration tests.                                                           |
| Forms                | React Hook Form + Zod                                                   | One Zod schema per form, **shared by the form and the mock API**, so client and "server" validation cannot disagree.                                                                                                                                        |
| Headless primitives  | Radix Dialog, DropdownMenu, Switch, Popover, Tooltip                    | Permitted by the brief. Focus trapping, Esc, ARIA roles and keyboard support for free. All visuals are our own.                                                                                                                                             |
| Charts               | Hand-rolled SVG                                                         | Two charts did not justify a chart library. They use the same CSS tokens, so they theme automatically, and the trend chart has an accessible data table.                                                                                                    |
| Tests                | Vitest + Testing Library + MSW node                                     | Unit tests for every pure module, integration tests that render real screens against the real handlers.                                                                                                                                                     |

## Architecture

```
Browser
  └─ React screens (src/features/*)
       ├─ read/write URL state (findings query, scan filter)
       ├─ TanStack Query hooks (src/api/queries.ts)
       │     └─ api() fetch wrapper (src/api/client.ts): token, JSON, ApiError
       │            └─ fetch('/api/...')  ── intercepted by ──▶ MSW handlers (src/mocks/handlers.ts)
       │                                                         ├─ 300–800 ms latency, fault injection
       │                                                         └─ mock DB (src/mocks/db.ts) ── sessionStorage
       └─ Zustand stores (src/stores/*): session, prefs, toasts, shell UI
```

**The issues engine** is the core of the centrepiece screen. One typed `FindingsQuery` holds text, severity, status, category, CWE, website, scan, multi-key sort and page. Pure, unit-tested functions keep it in sync with the URL and apply it:

```
URL search params  ⇄  FindingsQuery
                            │
                 applyQuery(findings, query) → filter → sort → paginate   (memoised)
                 facetCounts(findings, query) → live counts in each filter menu
```

**The mock backend is time-based.** Scans store timestamps, and progress is computed on each read, so a running scan keeps advancing across reloads with no timers. When a simulated scan completes, it "discovers" new findings. Derived fields (`openFindings`, `lastScannedAt`, `findingsCount`) are computed on read, never stored, so they cannot drift.

A full map of files and responsibilities is in [`docs/CODEBASE-MAP.md`](docs/CODEBASE-MAP.md). The design system and its decisions are in [`docs/DESIGN-v2.md`](docs/DESIGN-v2.md).

## Requirements checklist

| Requirement (brief)                                                                                                        | Where / how                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7 screens, real URLs, protected behind login                                                                               | `/login /dashboard /targets /scans /findings /findings/:id /reports /settings`; `RequireAuth` redirects with `?next=` (same-site only, so it is not an open redirect)                                                                                                                                                               |
| Login: validation, bad-credential error, fake token                                                                        | Zod + inline errors; 401 shows an inline alert; token in the persisted auth store                                                                                                                                                                                                                                                   |
| Dashboard: totals, severity breakdown, 2+ charts, recent scans, stats link to filtered views                               | Stat strip (websites, scans, open issues, critical), severity donut, 30-day trend, Fix first, recent scans; every number and chart segment links                                                                                                                                                                                    |
| Targets: table, add modal, validated form, auth toggle reveals credentials, edit, remove                                   | `TargetsPage`, `TargetFormDialog`; confirm dialog on remove; optimistic updates                                                                                                                                                                                                                                                     |
| Scans: statuses, target, start, duration, findings count, New scan, animated progress on a timer, completed opens findings | `ScansPage`; 2 s polling of a time-based simulation; progress bar + current step; completed row opens `/findings?scan=…`                                                                                                                                                                                                            |
| Findings: search, severity/category/status filters, sort any column, pagination, all combinable, row opens detail          | `FindingsPage` + `applyQuery`; plus website filter, quick views, multi-sort (Shift-click), page size                                                                                                                                                                                                                                |
| Finding detail: everything in the brief + status control                                                                   | `FindingDetail`; evidence panel with payload highlighting and secret masking; status New, Confirmed, Fixed, Not an issue                                                                                                                                                                                                            |
| Reports: list, Download PDF, Generate from a scan                                                                          | Real PDF built client-side (`lib/pdf.ts`); Create report lists completed scans only                                                                                                                                                                                                                                                 |
| Settings: profile, persistent theme toggle, API key field                                                                  | Validated profile; Light/Dark/Match system (applied before first paint); API key shown as a clearly labelled placeholder                                                                                                                                                                                                            |
| Every list has loading, empty and error states                                                                             | Shared `SkeletonRows`, `EmptyState`, `ErrorState`; Settings, _Simulate a server outage_ shows them all                                                                                                                                                                                                                              |
| Mock API: 300 to 800 ms latency, 1+ failing endpoint handled gracefully                                                    | Random latency in every handler. `GET /api/reports` fails its first request each page load with 503; the client treats 503 as temporary and retries with backoff, so the list still loads (`api/reportsRetry.test.ts`). The outage switch returns 500 everywhere, which is not retried and shows the error state with **Try again** |
| Status changes persist for the session                                                                                     | Mock DB saved to `sessionStorage`; optimistic cache update in the UI                                                                                                                                                                                                                                                                |
| 6+ targets, 10+ scans, 40+ findings, OWASP labels, real CWEs                                                               | 8 websites, 12 scans, 48 issues across all 5 severities and all 10 OWASP 2021 categories (asserted by tests)                                                                                                                                                                                                                        |

**Stretch goals done:** bulk actions, saved filter views, CSV export (with formula-injection protection), command palette (Ctrl/Cmd+K), severity trend over time, skeleton loaders, unit tests on filter logic, narrow/mobile layout.

## Accessibility

- Severity and status are **never colour alone**: every badge is an icon plus a word.
- `src/styles/contrast.test.ts` checks every text/background token pair the components use, in both themes, against WCAG AA (4.5:1 or more).
- Visible focus ring everywhere; skip link; landmarks (`nav`, `header`, `main`); `aria-sort` on sortable headers.
- Dialogs, the side panel and the quick finder trap focus and close on Esc (Radix). The status control is a radio group.
- Result counts and toasts are announced in live regions.
- Security jargon (OWASP, CWE, evidence) has a "What's this?" explanation next to it.
- `prefers-reduced-motion` turns off every animation.
- `eslint-plugin-jsx-a11y` runs in CI with zero warnings allowed.

## Performance

- The findings pipeline is a pure function memoised on `(data, query)`; the table is `React.memo` and only re-renders when rows, sort or selection change.
- The search input is debounced (200 ms).
- Pagination (10/20/50) rather than virtualisation: with tens of rows, pagination is simpler and keeps keyboard navigation predictable. `applyQuery` already returns the full matched list, so a virtual list could be swapped in.
- Each screen is a lazy-loaded chunk. The mock layer is a separate chunk, so the app entry is ~171 kB (54 kB gzip).
- Scan polling only runs while a scan is queued or running.

## Testing

`npm run test` runs 117 tests:

- **Issues engine:** URL and query round-trip, normalisers, filter/sort/paginate combinations, facet counts.
- **Mock database** (scan lifecycle over simulated time, cascade delete, validation), **dashboard aggregations and setup checklist**, **evidence highlighting**, **CSV**, **PDF structure (xref offsets)**, **safe redirect**.
- **Reports failure handling:** the first-load 503 recovers automatically; a 500 outage still reaches the error state.
- **Colour contrast:** 32 token pairs in each of the 2 themes.
- **Integration:** sign-in (inline validation, wrong password, success, redirect; one-click demo) and Issues (URL filter + quick view + search + sort, empty state), rendered against the real MSW handlers in Node.

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
- Saved views are per-browser (localStorage), not per-account.
- Bulk actions apply one status to all selected rows; single-issue changes have Undo, bulk changes do not.
- The API key in Settings is a placeholder; there is no key management yet.

## Project structure

```
src/
  api/          fetch client + TanStack Query hooks
  app/          App, routes, providers
  components/   layout shell (sidebar, top bar, mobile tab bar, quick finder) and UI primitives
  features/     one folder per screen: auth, dashboard, targets, scans, findings, reports, settings
  hooks/        theme sync, tab titles, clock
  lib/          pure helpers: labels, format, schemas, csv, pdf, pagination, safeNext
  mocks/        MSW handlers, mock DB, seed data and vulnerability catalogue
  stores/       Zustand stores
  styles/       design tokens + Tailwind entry + contrast test
  types/        domain types that mirror the data contract
```
