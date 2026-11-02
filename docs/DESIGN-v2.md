# Design v2 — Calm, premium, beginner-friendly

> **Update (v2.1, "Refined"):** after review the indigo/gradient look read as AI-generated. Section 14 replaces the name (Lumen → **Clearsite**), colour, type and shape rules below. Layout, screens, copy principles and the review refinements in section 13 still apply.

Status: **Approved and implemented** (2026-11-02). Decisions A–H approved as recommended, with the five refinements in §13.
Replaces: `docs/DESIGN.md` (v1, "REDCELL" terminal/TUI direction), kept for history only.

> **North star (from review):** a beginner should be able to open the app, add a website, start a scan, understand the results and know how to fix an issue without anyone explaining the interface.

---

## 0. Why v2

v1 looked like a hacker's terminal: monospace everywhere, `[ BRACKET ]` buttons, a tmux tab bar, a command prompt with its own filter language, a boot log, a CRT mode. That is fun for an expert. For a first-time user it is a wall of jargon:

| v1 problem                                                  | What a new user feels                  |
| ----------------------------------------------------------- | -------------------------------------- |
| Everything is monospace, all-caps, bracketed                | "This is a developer tool, not for me" |
| Navigation is `1:dashboard 2:targets` + `Alt+1…6`           | "Where are the pages?"                 |
| Filtering is a typed language (`sev:crit,high status:open`) | "What do I type?"                      |
| Words like _ops, sitrep, operator, passphrase, access gate_ | "I don't speak this language"          |
| Red/black, glow, scanlines                                  | "Something is wrong / alarming"        |
| Severity shown as `[CRIT]` codes                            | "How bad is this, really?"             |

**v2 goal in one line:** _a security tool that feels as calm and obvious as a good banking or analytics app — anyone can open it, understand what's wrong, and know what to do next._

### Design principles (the tie-breakers)

1. **Obvious over clever.** If a feature needs explaining, simplify it before adding a tooltip.
2. **Plain language first, technical detail second.** Say "Fix now" before "Critical", say "Issue" before "Finding", show CWE only as a secondary detail with a "What's this?" explanation.
3. **Always show the next step.** Every screen has one clear primary action. Every empty state tells you what to do.
4. **Calm, not alarming.** Colour is reserved for meaning (severity, status). The rest of the UI is quiet neutrals.
5. **Premium = restraint.** Generous whitespace, one typeface family, soft depth, crisp alignment, smooth 150–200 ms motion. No gimmicks.

**References (feel, not copy):** Linear (clarity, density done well), Stripe Dashboard (calm neutrals, great tables), Vercel (typography, restraint), Notion (friendliness, empty states).

---

## 1. Product name and voice

**Name (recommended): `Lumen`** — "bringing light to what's hidden on your website". Friendly, short, not militaristic.
Alternatives: _Clearpath_, _Sitewise_, or keep _REDCELL_. → Decision **A** in §12.

**Voice:** friendly, short, specific. Second person ("your website"). No jargon without an explanation next to it.

| v1 wording                  | v2 wording                                                               |
| --------------------------- | ------------------------------------------------------------------------ |
| Access gate / Authenticate  | Sign in                                                                  |
| Operator email / Passphrase | Email / Password                                                         |
| ACCESS DENIED               | That email or password doesn't match. Try again or use the demo account. |
| SITREP                      | Overview                                                                 |
| OPS RUN                     | Scans run                                                                |
| `> fetching /api/findings…` | (skeleton only, no text)                                                 |
| ERR 503 /api/reports        | We couldn't load your reports. This is usually temporary. **Try again**  |
| `0 findings match sev:crit` | No issues match these filters. **Clear filters**                         |

### Friendly labels (UI only — the data contract does not change)

The brief's JSON enums stay exactly the same (`critical`, `false_positive`, …). Only what the user _reads_ changes.

| Concept (contract) | Nav / page label    | Why                                                                  |
| ------------------ | ------------------- | -------------------------------------------------------------------- |
| Targets            | **Websites & APIs** | "Target" sounds like attacking; users think in terms of "my website" |
| Scans              | **Scans**           | Already a plain word                                                 |
| Findings           | **Issues**          | Everyone knows what an "issue" is                                    |
| Reports            | **Reports**         | Plain                                                                |

URLs stay as the brief specifies (`/targets`, `/scans`, `/findings`, `/findings/:id`, `/reports`, `/settings`) so nothing in routing or grading changes. → Decision **B** (keep brief's words vs friendly words).

**Severity** — always a word, a colour and an icon, never colour alone:

| Contract   | Badge label | Helper text (tooltip + legend)                             |
| ---------- | ----------- | ---------------------------------------------------------- |
| `critical` | Critical    | Can be exploited easily and cause serious damage. Fix now. |
| `high`     | High        | Serious risk. Fix this week.                               |
| `medium`   | Medium      | Real risk under some conditions. Plan a fix.               |
| `low`      | Low         | Minor risk. Fix when convenient.                           |
| `info`     | Info        | Not a risk on its own. Good to know.                       |

**Status:**

| Contract         | Label        | Helper text                               |
| ---------------- | ------------ | ----------------------------------------- |
| `open`           | New          | Found by a scan, not reviewed yet.        |
| `confirmed`      | Confirmed    | You checked it — it's a real problem.     |
| `resolved`       | Fixed        | The problem has been fixed.               |
| `false_positive` | Not an issue | Reviewed — this isn't actually a problem. |

**Jargon helpers:** OWASP category and CWE are shown as small grey secondary text with an ⓘ "What's this?" popover, e.g. _"CWE-89 is the standard ID for this type of weakness. Security teams use it to look up details."_

---

## 2. Colour

### Rule

Neutrals carry the interface. **One brand colour (indigo)** is used only for primary actions, links, focus and the active nav item. **Severity colours appear only on severity badges and charts.** Green appears only for "Fixed"/success. Nothing else is coloured.

Indigo was chosen because it reads as trustworthy and calm, is clearly _not_ a severity colour (so it never gets confused with "danger"), and has excellent contrast in both themes.

### Light theme (default)

| Token             | Value                                  | Use                                        |
| ----------------- | -------------------------------------- | ------------------------------------------ |
| `--bg`            | `#F7F7F5`                              | App canvas (warm off-white)                |
| `--surface`       | `#FFFFFF`                              | Cards, tables, dialogs                     |
| `--surface-2`     | `#F1F1EE`                              | Hover rows, input backgrounds, code header |
| `--border`        | `#E6E5E1`                              | Card and table borders                     |
| `--border-strong` | `#D4D3CE`                              | Inputs, dividers that must be seen         |
| `--text`          | `#18181B`                              | Headings, primary text                     |
| `--text-2`        | `#52525B`                              | Body/secondary text                        |
| `--text-3`        | `#6B6B73`                              | Meta text, placeholders                    |
| `--brand`         | `#4F46E5`                              | Primary buttons, links, active nav         |
| `--brand-hover`   | `#4338CA`                              | Hover/pressed                              |
| `--brand-soft`    | `#EEF0FF`                              | Active nav background, selected rows       |
| `--success`       | `#067647` on `#ECFDF3`                 | Fixed, success toasts                      |
| `--focus`         | `#4F46E5`                              | 2 px focus ring + 2 px offset              |
| `--shadow-sm`     | `0 1px 2px rgb(16 24 40 / .05)`        | Cards                                      |
| `--shadow-lg`     | `0 12px 32px -8px rgb(16 24 40 / .18)` | Dialogs, popovers                          |

### Dark theme

| Token             | Value                                |
| ----------------- | ------------------------------------ |
| `--bg`            | `#0E0E11`                            |
| `--surface`       | `#16161A`                            |
| `--surface-2`     | `#1D1D22`                            |
| `--border`        | `#2A2A31`                            |
| `--border-strong` | `#3A3A42`                            |
| `--text`          | `#F4F4F5`                            |
| `--text-2`        | `#A1A1AA`                            |
| `--text-3`        | `#8B8B94`                            |
| `--brand`         | `#8B93FF` (text on brand: `#0E0E11`) |
| `--brand-soft`    | `#1F2040`                            |
| `--success`       | `#75E0A7` on `#10241A`               |

Dark is a soft charcoal, not pure black — premium apps avoid `#000` because it makes text "vibrate".

### Severity (badge = soft tint background + strong text + icon)

| Severity | Light text / bg       | Dark text / bg        | Icon             |
| -------- | --------------------- | --------------------- | ---------------- |
| Critical | `#B42318` / `#FEF3F2` | `#FDA29B` / `#2A1715` | ⬣ octagon-alert  |
| High     | `#B54708` / `#FFF6ED` | `#FEC84B` / `#2A1F12` | ▲ triangle-alert |
| Medium   | `#8A5A00` / `#FEF7E0` | `#FDE272` / `#29250F` | ◆ diamond        |
| Low      | `#175CD3` / `#EFF8FF` | `#84CAFF` / `#13202E` | ● circle         |
| Info     | `#475467` / `#F2F4F7` | `#D0D5DD` / `#202329` | ⓘ info           |

### Contrast (computed, WCAG 2.1)

All text pairs pass AA (≥ 4.5:1). Lowest pair is light `--text-3` on `--bg` at **4.92:1**.

| Pair                    | Ratio | Pair                   | Ratio |
| ----------------------- | ----- | ---------------------- | ----- |
| Light text on bg        | 16.52 | Dark text on bg        | 17.53 |
| Light text-2 on surface | 7.73  | Dark text-2 on surface | 7.04  |
| Light text-3 on bg      | 4.92  | Dark text-3 on surface | 5.34  |
| White on brand          | 6.29  | Dark ink on dark brand | 7.08  |
| Critical badge (light)  | 6.05  | Critical badge (dark)  | 8.78  |
| High badge (light)      | 5.08  | High badge (dark)      | 10.42 |
| Medium badge (light)    | 5.53  | Medium badge (dark)    | 11.93 |
| Low badge (light)       | 5.57  | Low badge (dark)       | 9.32  |
| Info badge (light)      | 6.98  | Info badge (dark)      | 10.68 |
| Success (light)         | 5.40  | Success (dark)         | 10.06 |

---

## 3. Typography

**One family: Geist** (sans) for the whole interface, **Geist Mono** only inside the evidence code block and for IDs like `CWE-89` in tables. Both self-hosted via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` (verified on npm, v5.3.0) — no Google Fonts request, no layout shift.

Why Geist: modern, very legible at small sizes, neutral but with character, designed for product UIs. Fallback alternative: **Inter** (`@fontsource-variable/inter`, also verified). → Decision **C**.

| Role          | Size / line-height | Weight  | Tracking | Use                                         |
| ------------- | ------------------ | ------- | -------- | ------------------------------------------- |
| Display       | 32 / 40            | 600     | −0.02em  | Login headline, page hero numbers           |
| H1 page title | 24 / 32            | 600     | −0.015em | One per page                                |
| H2 section    | 18 / 28            | 600     | −0.01em  | Card titles                                 |
| H3            | 15 / 22            | 600     | 0        | Sub-sections                                |
| Body          | 14 / 22            | 400     | 0        | Default text                                |
| Body large    | 16 / 26            | 400     | 0        | Descriptions on detail page                 |
| Small / meta  | 13 / 20            | 400–500 | 0        | Table meta, helper text                     |
| Label caps    | 12 / 16            | 500     | +0.04em  | Table headers (sentence case, not ALL CAPS) |
| Stat number   | 30 / 36            | 600     | −0.02em  | Dashboard stat cards, `tabular-nums`        |
| Code          | 13 / 20 Geist Mono | 400     | 0        | Evidence only                               |

Rules: sentence case everywhere (no ALL-CAPS), numbers use `tabular-nums` so columns align, max line length ~70 characters for descriptions.

---

## 4. Shape, space, depth, icons

- **Spacing:** 4 px grid. Page padding 32 px desktop / 16 px mobile. Card padding 20–24 px. Gap between cards 16–24 px.
- **Radius:** controls 8 px, cards 12 px, dialogs 16 px, badges/pills full.
- **Depth:** cards = 1 px border + `--shadow-sm`. Popovers/dialogs = `--shadow-lg`. No glows.
- **Icons:** Lucide (`lucide-react`), 16 px in controls, 20 px in nav, 1.75 px stroke. Replaces the hand-rolled icon set — consistent, tree-shaken, MIT. → Decision **D** (or keep the existing `Icons.tsx` and redraw in the new style).
- **Max content width:** 1280 px, centred.

---

## 5. Layout and navigation

```
┌──────────────┬───────────────────────────────────────────────────────────────┐
│ ◐ Lumen      │  Issues                       [🔍 Search…  Ctrl K]  [+ New scan] (DS) │
│              ├───────────────────────────────────────────────────────────────┤
│ ▣ Overview   │                                                               │
│ 🌐 Websites  │   page content (max 1280 px)                                  │
│ ↻ Scans    ●1│                                                               │
│ ⚠ Issues  27 │                                                               │
│ 📄 Reports   │                                                               │
│              │                                                               │
│ ──────────── │                                                               │
│ ⚙ Settings   │                                                               │
│ ? Help       │                                                               │
│ ☾ / ☀ theme  │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

- **Left sidebar** (240 px) with icon + label for every page — the most familiar pattern there is. Active item: brand-soft background + brand text. Small count badges: running scans (with a gentle live dot), open issues.
- Sidebar **collapses to icons** (72 px) with a toggle; preference remembered.
- **Top bar:** page title, a search button that opens the **command palette** (Ctrl/⌘ K: "Go to Issues", "Add website", "New scan", "Search issues…" — friendly words, no syntax), the primary **+ New scan** button, and the account menu (avatar → Settings, Sign out).
- **Breadcrumbs** on detail pages: `Issues › SQL injection in product search`.
- **Mobile (< 768 px):** sidebar becomes a **bottom tab bar** (Overview, Websites, Scans, Issues, More). Tables become cards. Top bar keeps title + New scan.
- **Removed from v1:** tmux window bar, `Alt+1…6`, `g`-chords, status bar with UTC clock/API latency, the typed prompt, CRT mode, boot log.
- Keyboard still fully works (Tab order, Enter, Esc, arrows in menus). Power shortcuts (`/` search, `Ctrl K`, `j/k` in issues) remain but are hidden extras, listed in Help → "Keyboard shortcuts". They never appear as required knowledge.

---

## 6. Components

| Component                 | v2 look and behaviour                                                                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**                | Primary (brand fill, white text), Secondary (white, border), Ghost (text only), Danger (red text, red fill only inside confirm dialogs). Height 36 px (32 small, 40 large). Icon + label. Loading = small spinner, label stays. |
| **Input**                 | 36 px, 8 px radius, label above, helper text below, error text in red with icon below the field. Errors shown on blur and on submit.                                                                                            |
| **Select / multi-select** | Popover with checkboxes and live counts ("High · 9"). Search inside if > 8 options.                                                                                                                                             |
| **Switch**                | Real pill switch (not `[ on]`).                                                                                                                                                                                                 |
| **Badge**                 | Pill: icon + word. Severity, status, environment (Production = neutral dark pill with a small dot, Staging = neutral, Dev = neutral outline — environment is _not_ coloured like severity).                                     |
| **Card**                  | Surface, border, radius 12, shadow-sm. Optional header with title + action link.                                                                                                                                                |
| **Table**                 | White card, sticky header, 52 px rows, row hover `--surface-2`, whole row clickable, sort arrow on hover/active, sentence-case headers.                                                                                         |
| **Dialog**                | Centred, 16 px radius, title + one-line description, footer buttons right-aligned (Cancel, Primary). Radix Dialog (already used).                                                                                               |
| **Side panel (drawer)**   | 560 px from the right, for issue preview. Esc / outside click closes.                                                                                                                                                           |
| **Toast**                 | Bottom-right, white card with icon, auto-dismiss 5 s, action link ("Undo", "View").                                                                                                                                             |
| **Tooltip / popover**     | For "What's this?" helpers. Radix Tooltip/Popover (permitted).                                                                                                                                                                  |
| **Progress bar**          | 6 px rounded bar, brand colour, smooth width transition, % label and "about 2 min left".                                                                                                                                        |
| **Skeleton**              | Soft grey blocks in the real layout shape, gentle shimmer (off under reduced motion).                                                                                                                                           |
| **Empty state**           | Simple line illustration (inline SVG), one-sentence title, one-sentence help, one primary button.                                                                                                                               |
| **Error state**           | Same layout as empty, with a calm warning icon, a plain-language reason, and **Try again**.                                                                                                                                     |
| **Stepper (status)**      | Segmented control with 4 options and helper text under the selected one.                                                                                                                                                        |

---

## 7. Screen by screen

All lists have designed **loading** (skeleton), **empty** (illustration + next action) and **error** (reason + Try again) states — required by the brief.

### 01 · `/login` — Sign in

```
┌───────────────────────────────┬──────────────────────────────────┐
│                               │                                  │
│   ◐ Lumen                     │   Welcome back                   │
│                               │   Sign in to check your websites │
│   Find and fix website        │                                  │
│   security issues — in plain  │   Email                          │
│   language.                   │   [ you@company.com           ]  │
│                               │   Password                       │
│   ✓ Scan sites & APIs         │   [ ••••••••            👁 ]     │
│   ✓ See what's wrong & why    │                                  │
│   ✓ Get step-by-step fixes    │   [        Sign in         ]     │
│                               │                                  │
│   (soft gradient + product    │   ─────────── or ───────────     │
│    screenshot illustration)   │   [ Try the demo account ]       │
│                               │                                  │
└───────────────────────────────┴──────────────────────────────────┘
```

- Left panel: brand, one-line value proposition, three benefit ticks, soft indigo gradient with a blurred product preview. Hidden on mobile.
- "Try the demo account" fills and submits in one click — the fastest path for evaluators and beginners.
- Validation on blur: "Enter a valid email address", "Password must be at least 6 characters". Bad credentials: a red inline alert above the button.
- On success → fake token in the auth store → redirect to `?next=` or Overview. All other routes protected (existing `RequireAuth`).

### 02 · `/dashboard` — Overview

```
Good morning, Alex                                          [+ New scan]
Here's how your websites are doing.

┌ Get started ───────────────────────────────────────── 2 of 4 done  ✕ ┐
│ ✓ Add a website   ✓ Run a scan   ○ Review issues   ○ Download a report │
└────────────────────────────────────────────────────────────────────────┘

┌ Websites ─────┐ ┌ Scans run ────┐ ┌ Open issues ──┐ ┌ Need urgent fix ┐
│ 8             │ │ 12            │ │ 27            │ │ 4  Critical      │
│ View all →    │ │ 1 running now │ │ +5 this week  │ │ Fix these first →│
└───────────────┘ └───────────────┘ └───────────────┘ └──────────────────┘

┌ Open issues by severity ─────────┐ ┌ New issues over time · 30 days ───┐
│      ╭───╮    ● Critical  4      │ │   ▁▂▅▃▁▇▃▂▁▄▆▂ … (soft area chart)│
│     │ 27 │    ● High      9      │ │                                    │
│      ╰───╯    ● Medium    8      │ │                                    │
│               ● Low       5 …    │ │                                    │
└──────────────────────────────────┘ └────────────────────────────────────┘

┌ Recent scans ─────────────────────────────────────────── View all → ┐
│ Acme Store       ▬▬▬▬▬▬▬░░░ 62% · about 2 min left       Running    │
│ Billing API      1 Critical · 2 High · 3 Medium           Completed  │
└──────────────────────────────────────────────────────────────────────┘
```

- **Get started checklist** (new): the brief's workflow as 4 steps, auto-ticked from real data (any target → step 1, any scan → 2, any issue status changed → 3, any report → 4). Dismissible, remembered. This is the single biggest help for beginners.
- **4 stat cards**, each a link to the filtered view (brief requirement): Websites → `/targets`, Scans → `/scans`, Open issues → `/findings?status=open,confirmed`, Need urgent fix → `/findings?sev=critical&status=open,confirmed`.
- **Chart 1:** donut with the total in the centre and a legend that lists every count (so the legend gives exact magnitude — the reason v1 avoided donuts is solved). Clicking a slice or legend row opens filtered Issues.
- **Chart 2:** soft area chart, 30 days, stacked by severity, hover tooltip "Feb 18 · 3 new issues (1 High, 2 Medium)".
- Charts stay hand-rolled SVG reading the CSS tokens (reuse `stats.ts`, restyle `Charts.tsx`).
- Recent scans: 5 rows, running ones show a live progress bar.

### 03 · `/targets` — Websites & APIs

```
Websites & APIs                                         [+ Add website]
The sites and APIs you're allowed to scan.

[🔍 Search by name or URL ]                     [Environment ▾]

┌───────────────────────────────────────────────────────────────────────┐
│ Name ↕          Environment   Last scanned ↕   Open issues ↕          │
├───────────────────────────────────────────────────────────────────────┤
│ Acme Store      ● Production  2 hours ago      ⬣1 ▲2 ◆3      [Scan] ⋯ │
│ shop.example.com  🔒 Login                                            │
└───────────────────────────────────────────────────────────────────────┘
```

- URL shown under the name in grey; a small 🔒 "Login" note if it's an authenticated scan.
- Row actions: **Scan** (quick launch) and a ⋯ menu with Edit / Remove.
- **Add / Edit dialog:** Display name · URL (validated, "Must start with https:// or http://") · Environment (segmented: Production / Staging / Development, with one-line hint "Production is your live site") · Switch "This site needs a login to scan" → reveals Username + Password with a smooth height animation. A reassurance line: "Only add sites you own or have permission to test."
- **Remove:** a small confirm dialog: "Remove Acme Store? Its scan history stays in Reports." [Cancel] [Remove]. (v1's inline row confirm was compact but easy to miss.)
- Optimistic add/edit/remove with rollback + toast on failure (already implemented in `queries.ts`).
- Empty: "No websites yet — add your first website to start scanning." [+ Add website]

### 04 · `/scans` — Scans

```
Scans                                                    [+ New scan]
[ All 12 ] [ Running 1 ] [ Queued 1 ] [ Completed 9 ] [ Failed 1 ]   (tabs)

┌───────────────────────────────────────────────────────────────────────┐
│ Website        Status        Started        Duration   Issues found   │
├───────────────────────────────────────────────────────────────────────┤
│ Acme Store     ● Running     Today 09:00    4m 12s     ▬▬▬▬▬▬░░ 62%    │
│                Checking the checkout page…                            │
│ Billing API    ✓ Completed   Today 08:41    12m 22s    ⬣1 ▲2 ◆3 ●1  → │
│ Partner API    ✕ Failed      Today 07:10    38s        Couldn't reach the site  [Retry] │
│ Docs Portal    ◷ Queued      —              —          Waiting to start │
└───────────────────────────────────────────────────────────────────────┘
```

- Status as a pill with icon + word. Running has a gentle pulsing dot (the only pulsing thing).
- Running progress advances on a timer (existing time-based simulation in `mocks/db.ts`) with a friendly step line ("Checking the checkout page…").
- Completed row → opens `/findings?scan=…` (brief requirement). Failed row shows a plain reason and **Retry**.
- **New scan dialog:** pick a website from a list with search (shows last scanned), "Start scan". Toast: "Scan started on Acme Store. We'll let you know when it's done." + toast when it completes (existing scan-completion watcher).

### 05 · `/findings` — Issues (centrepiece)

```
Issues                                         [Export CSV]
27 open issues across 8 websites

[ All ] [ Needs attention 27 ] [ Fixed 14 ] [ Not an issue 7 ]       ← quick views (tabs)

[🔍 Search issues, pages or CWE…]  [Severity ▾] [Category ▾] [Status ▾] [Website ▾]
Active: (Critical ✕) (High ✕) (Acme Store ✕)                       Clear all

┌───────────────────────────────────────────────────────────────────────────────────┐
│ ☐  Severity ↓  Issue ↕                          Category       Website   Status    Found ↕ │
├───────────────────────────────────────────────────────────────────────────────────┤
│ ☐  ⬣ Critical  SQL injection in product search  Injection      Acme      ● New     2 days ago │
│                GET /search?q=                   A03 · CWE-89                              │
│ ☐  ▲ High      Reflected XSS in order status    Injection      Acme      ✓ Confirmed 3 days ago │
└───────────────────────────────────────────────────────────────────────────────────┘
Showing 1–20 of 27                            ‹ 1 2 › · 20 per page ▾

── when rows are selected (floating bar) ─────────────────────────────
  3 selected   [Mark confirmed] [Mark fixed] [Not an issue]   ✕
```

- **Search + filters + sort + pagination all combine** and live in the URL (reuse `query.ts` URL params, `applyQuery.ts`, `useFindingsQuery.ts` — the logic and its tests stay). Reload, share or Back keeps the view.
- **Filters are dropdowns with checkboxes and live counts**, not a typed language. Active filters appear as removable pills with **Clear all**.
- **Quick views** (replaces v1 "saved views" syntax): All / Needs attention (New + Confirmed) / Fixed / Not an issue, with counts. Users can still "Save current view" from a small menu (stretch goal kept, friendlier).
- Every column sortable (`aria-sort`, arrow). Default sort: severity, then newest.
- Row click → **side panel** preview at `/findings/:id` with table still visible; "Open full page" link. Direct visit renders full page (existing modal-route pattern, reused).
- Bulk actions bar slides up from the bottom when rows are selected.
- Category column shows the friendly name ("Injection"), with "A03 · CWE-89" as small grey meta.
- CSV export of the current filtered + sorted view (reuse `csv.ts`, formula-injection safe).
- Empty (no data): "No issues yet — run a scan to find them." Empty (filtered): "No issues match these filters." [Clear filters].

### 06 · `/findings/:id` — Issue detail

```
Issues › SQL injection in product search                          ‹ Prev  Next ›

⬣ Critical    Injection · A03 ⓘ · CWE-89 ⓘ
SQL injection in product search
Found on Acme Store · GET /search?q= · 2 days ago by scan #118

┌ Status ──────────────────────────────────────────────────────────────┐
│ [ New ] [ Confirmed ] [ Fixed ] [ Not an issue ]                      │
│ You checked it — it's a real problem.                                 │
└───────────────────────────────────────────────────────────────────────┘

① What's wrong                                       ┌ Details ───────────┐
User input in the q parameter reaches the database   │ Website  Acme Store │
query unsanitised…                                   │ URL  shop.example…  │
                                                     │ Where  GET /search  │
② Proof (evidence)                                   │ Scan  #118          │
┌ Request ─────────────── Copy ┐┌ Response ── Copy ┐ │ Found  Feb 18, 09:06│
│ GET /search?q=test%27 HTTP/1.1││ HTTP/1.1 500 …   │ │ CWE-89 ↗ Learn more │
│ Host: shop.example.com        ││ …SQL syntax error│ └────────────────────┘
│ Cookie: session=•••• [Show]   ││                  │
└───────────────────────────────┘└──────────────────┘

③ How to fix
✓ Use parameterised queries.
✓ Validate and encode input.
```

- Reading order answers a beginner's questions: **What's wrong → Proof → How to fix.** Numbered section headings make it a guided read.
- Status control = segmented control with helper text (brief state machine kept; changes update client state for the session — existing `useSetFindingStatus`). Toast with **Undo**.
- Evidence block: dark code panel in **both** themes (code looks best on dark, and it visually separates "raw technical data" from friendly text), Geist Mono, line numbers, Copy buttons, payload subtly highlighted, secrets masked with **Show** (reuse `evidence.ts`). Panes stack on mobile and scroll horizontally on their own.
- Remediation text split into a checklist when it contains sentences.
- "Learn more" links CWE to MITRE in a new tab.
- Prev/Next to move through the current filtered list.

### 07a · `/reports` — Reports

```
Reports                                               [Create report]
Share-ready PDF summaries of completed scans.

┌───────────────────────────────────────────────────────────────────────┐
│ 📄 Acme Store — Scan #118     7 issues  ⬣1 ▲2 ◆3 ●1   Feb 18   [⤓ Download PDF] │
└───────────────────────────────────────────────────────────────────────┘
```

- "Create report" dialog lists **completed scans only**, newest first, with website name and issue count.
- Download generates the dummy PDF (reuse `reportPdf.ts`) and toasts "Report downloaded".
- **This stays the failing endpoint** (brief requirement), shown with the friendly error state and **Try again**.

### 07b · `/settings` — Settings

Sections in cards with a left sub-nav (Profile · Appearance · API key · Advanced):

- **Profile:** name, email, role — validated form, Save.
- **Appearance:** three visual cards — _Light_ / _Dark_ / _Match my system_ — each with a mini preview. Persists in `localStorage` (existing `usePrefsStore`).
- **API key:** masked field `lm_live_••••••••` with Show / Copy / Regenerate (regenerate asks to confirm). Placeholder, as the brief says.
- **Advanced (for demo):** "Simulate a server outage" switch and "Reset demo data" — kept from v1 because they demonstrate error handling, labelled clearly as demo tools.
- **Removed:** CRT mode.

---

## 8. Motion

Subtle, fast, purposeful. All disabled under `prefers-reduced-motion`.

| Moment                       | Motion                            | Duration                 |
| ---------------------------- | --------------------------------- | ------------------------ |
| Page content on route change | Fade + 4 px rise                  | 180 ms                   |
| Dialog / side panel open     | Fade + scale 0.98→1 / slide-in    | 200 ms                   |
| Dropdowns, tooltips          | Fade                              | 120 ms                   |
| Running scan progress        | Width transition + live dot pulse | continuous while running |
| Skeleton shimmer             | Soft gradient sweep               | 1.4 s loop               |
| Status change / toast        | Slide up + fade                   | 180 ms                   |

Easing: `cubic-bezier(0.2, 0, 0, 1)`. Removed from v1: boot-log typing, count-up readouts, blinking cursor, CRT glow.

---

## 9. Accessibility (brief: 10%)

- Severity and status are always **icon + word + colour**, never colour alone.
- All text ≥ 4.5:1 (table in §2). Focus ring: 2 px brand outline + 2 px offset, always visible on keyboard focus (`:focus-visible`).
- Landmarks: `nav` (sidebar), `header` (top bar), `main`. Skip link "Skip to content".
- Tables: `caption`, `scope="col"`, `aria-sort`. Selectable rows use real checkboxes with labels.
- Dialogs and side panel: Radix focus trap, Esc closes, focus returns to the trigger.
- Live regions announce result counts ("27 issues") and toasts.
- Targets ≥ 36 px on desktop, ≥ 44 px on touch.
- `eslint-plugin-jsx-a11y` stays on.

---

## 10. How v2 maps to the grading

| Criterion (weight)                  | How v2 earns it                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Findings screen (20%)               | URL-synced combined search/filter/sort/pagination, checkbox filters with counts, quick views, bulk actions, CSV, side panel |
| UX, visual craft, consistency (20%) | One colour rule, one type family, one component set; plain language; onboarding checklist                                   |
| Code quality / TS (20%)             | Logic layer reused unchanged; only presentation changes; tokens in one file                                                 |
| Completeness & states (15%)         | Skeleton / empty / error designed for every list                                                                            |
| Accessibility (10%)                 | §9                                                                                                                          |
| State & mock API (10%)              | Unchanged: TanStack Query + MSW, latency, failing reports endpoint, optimistic updates                                      |
| README, commits, demo (5%)          | Small commits per screen, README "Design v2" section                                                                        |

---

## 11. Engineering impact (what changes, what stays)

**Principle: change the skin, keep the brain.** Data, API, mocks, stores and the filter/sort logic (and their tests) are reused as-is.

| Area                                                                         | Keep / Change / Remove                                                                                                                | Detail                                                                                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api/`, `mocks/`, `types/`, `stores/auth`, `stores/toast`, `stores/net`      | **Keep**                                                                                                                              | No contract change                                                                                                                               |
| `features/findings/query.ts`, `applyQuery.ts`, `useFindingsQuery.ts` + tests | **Keep** (URL param parts)                                                                                                            | Prompt-syntax functions `parsePrompt/serializePrompt` removed with their tests                                                                   |
| `features/dashboard/stats.ts` + test                                         | **Keep**                                                                                                                              | Charts re-skinned                                                                                                                                |
| `styles/index.css`                                                           | **Change**                                                                                                                            | New token set (§2), Geist fonts, new keyframes; remove CRT + VT323/Commit Mono                                                                   |
| `components/layout/WindowBar.tsx`, `StatusBar.tsx`                           | **Replace**                                                                                                                           | New `Sidebar.tsx`, `TopBar.tsx`, `MobileTabBar.tsx`                                                                                              |
| `AppShell.tsx`                                                               | **Change**                                                                                                                            | New layout; keep scan-completion watcher; drop Alt/g shortcuts                                                                                   |
| `components/ui/*`                                                            | **Restyle**                                                                                                                           | Button, Field (real Switch), Tags → Badge, Dialog, States (illustrated empty), Pagination, ProgressRail → ProgressBar, PageHeader (no TUI panes) |
| `features/prompt/*`                                                          | **Remove**                                                                                                                            | Replaced by `CommandPalette.tsx` (navigation + actions + issue search, no syntax)                                                                |
| `features/dashboard`                                                         | **Add** `GetStartedChecklist.tsx`                                                                                                     | Derived from existing query data                                                                                                                 |
| `features/*Page.tsx`                                                         | **Restyle + copy**                                                                                                                    | Plain-language labels (§1) via `lib/labels.ts`                                                                                                   |
| `stores/prefs.ts`                                                            | **Change**                                                                                                                            | Remove CRT + prompt history; add sidebar collapsed, checklist dismissed                                                                          |
| New deps                                                                     | `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, `lucide-react`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip` | All permitted (headless/icons, not admin kits)                                                                                                   |
| Removed deps                                                                 | `@fontsource/commit-mono`, `@fontsource/vt323`                                                                                        |                                                                                                                                                  |
| `docs/CODEBASE-MAP.md`, `README.md`                                          | **Update** in the same change                                                                                                         |                                                                                                                                                  |

No database change is required: this is a front-end-only project with an in-browser mock API, and the data contract is untouched.

### Build order (follows the grading weights)

1. Tokens, fonts, icons → base UI components (Button, Field, Badge, Card, Dialog, States)
2. App shell: Sidebar, TopBar, mobile tab bar, command palette
3. Issues (findings) table + filters + side panel
4. Issue detail
5. Overview (dashboard) + Get started checklist
6. Sign in
7. Websites, Scans
8. Reports, Settings
9. Remove prompt/CRT code, update tests, map, README; run `npm run check` + build

---

## 12. Decisions (all approved as recommended)

| #   | Decision              | Recommended                                                | Alternatives                      |
| --- | --------------------- | ---------------------------------------------------------- | --------------------------------- |
| A   | Product name          | **Lumen**                                                  | Clearpath, Sitewise, keep REDCELL |
| B   | Page labels           | **Friendly** (Websites & APIs, Issues) with URLs unchanged | Brief's words (Targets, Findings) |
| C   | Font                  | **Geist + Geist Mono**                                     | Inter + JetBrains Mono            |
| D   | Icons                 | **lucide-react**                                           | Redraw existing `Icons.tsx`       |
| E   | Default theme         | **Light**, Dark available, "Match system" option           | Follow system by default          |
| F   | Brand colour          | **Indigo `#4F46E5`**                                       | Teal `#0F766E`, Blue `#2563EB`    |
| G   | Issue opens in        | **Side panel + full page** at same URL (already built)     | Full page only                    |
| H   | Get started checklist | **Include**                                                | Leave out                         |

---

## 13. Review refinements (applied in the implementation)

| #   | Refinement                                                              | How it is implemented                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Get started checklist prominent for new users, then gets out of the way | Shown above the stats while incomplete; collapses to a slim "You're all set" banner once all four steps are done; dismissible and remembered                                                                                                    |
| 2   | Command palette stays secondary                                         | Sidebar, visible search button, and labelled buttons are the primary navigation; Ctrl/⌘K only opens the same finder as the visible search button; every palette item is reachable elsewhere                                                     |
| 3   | Technical evidence optional, not intimidating                           | Order What's wrong → Proof → How to fix; the Proof section is collapsed by default, with a one-line explanation of why evidence matters always visible                                                                                          |
| 4   | API key placeholder must not look functional                            | A disabled placeholder field with a "Coming soon" badge and an explanation; no copy / reveal / regenerate actions                                                                                                                               |
| 5   | Reports failure must be retryable and the flow demonstrable             | `GET /api/reports` still fails its first request (503). The query client treats 503 as transient and retries with backoff, so the list loads; a real outage (Settings → Simulate a server outage, 500) shows the error state with **Try again** |

### Verification of the doc's technical claims

- **Contrast:** `src/styles/contrast.test.ts` reads the tokens from `index.css` and checks every foreground/background pair the components use (body text on every surface, brand, feedback, all severity badges, code panel) in both themes. 32 pairs × 2 themes, all ≥ 4.5:1.
- **Reuse:** checked against the repository before changing code. Kept unchanged: `api/` hooks and optimistic updates, `mocks/`, `findings/query.ts` URL functions, `applyQuery.ts`, `useFindingsQuery.ts`, `dashboard/stats.ts`, `detail/evidence.ts`, `lib/*`, and their tests. Removed: the typed prompt (`features/prompt`, `parsePrompt`/`serializePrompt` and their tests), CRT mode, status bar.

---

## 14. v2.1 "Refined" (implemented, supersedes §1 name, §2 colour, §3 type, §4 shape)

Chosen by the product owner from three options (Optics 3D, Midnight 3D, Refined no-3D). Research basis: common tells of AI-generated UI are purple/indigo gradients, generic copy, one large radius on everything, icon tiles on every card, pulsing "live" dots and em-dash headlines.

| Area     | Rule                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name     | **Clearsite** (one constant: `PRODUCT_NAME` in `hooks/useDocumentTitle.ts`). Wordmark in the display face, mark is a spruce tile with a check                                         |
| Colour   | Brand spruce `#0E5A4F` (dark theme `#5CC8B0`): the product's job is getting a site to "fixed". Neutrals are cool grey-greens (`#F5F7F6` canvas, `#111A17` ink). No gradients anywhere |
| Type     | Schibsted Grotesk for headings and big numbers, Public Sans for body, Geist Mono for code and IDs                                                                                     |
| Shape    | Controls 6 px, cards 8 px, dialogs 12 px; tags are 4 px, not pills. No decorative shadows on cards or buttons                                                                         |
| Copy     | Specific and data-driven ("36 open issues on 7 websites. 5 need fixing today."), sentence case, no em dashes in sentences, no greetings or slogans                                    |
| Titles   | Every page sets the tab title: "Issues · Clearsite", "<issue title> · Clearsite"                                                                                                      |
| Overview | Data-sentence headline, one stat strip (not four icon cards), **Fix first** list of the five most urgent issues, setup checklist only while incomplete                                |
| Motion   | 150–200 ms fades and rises only; no pulsing dots; running scans show progress bars                                                                                                    |

Contrast for the new palette is verified by `src/styles/contrast.test.ts` (64/64 pairs at 4.5:1 or more).
