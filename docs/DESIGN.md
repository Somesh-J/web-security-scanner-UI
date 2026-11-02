# REDCELL — Design Direction

Web security scanning console. Frontend intern assignment, seven screens.
Stack fixed by the brief: React 18 + TypeScript + Vite + Tailwind + React Router.

Status: **implemented**. See revision note below.

> **Revision 3 (implemented).** After review, the dashboard-style shell was replaced by a true terminal (TUI) layout.
> The brief specifies screens at the behaviour level only ("the visual design is yours"); it does not ask for a sidebar.
>
> - **Navigation:** tmux-style window list across the top (`1:dashboard 2:targets … 4:findings*`), active window in inverse video, `Alt+1…6`. No sidebar, no bottom tab bar.
> - **Type:** Commit Mono for everything (no sans-serif at all), VT323 (CRT pixel face) only for screen titles, dialog titles and big readouts (≥ 26 px). Both self-hosted via @fontsource; no Google Fonts request.
> - **Surfaces:** square, unfilled panes with the title set into the top border (`┤ FINDINGS ├`), dashed row rules, double-line dialog borders. Zero border radius.
> - **Controls:** buttons render as `[ ADD TARGET ]` and invert on hover; filter chips are `[x]`/`[ ]` checkboxes with counts; toggles are `[ on]`/`[off]`; theme choice is `(•)`; spinner is `| / - \`.
> - **Charts:** btop-style segmented block meters for severity, one block cell per finding in the 30-day histogram; segmented progress bars.
>
> Sections 5 and 4 below describe the earlier rail layout and Martian Mono / IBM Plex pairing and are kept for history.

---

## 1. Thesis

**Think like the attacker.**

A red team is the unit that attacks its own organisation to find the holes first. This console is their operations terminal. Every screen should feel like the tooling an offensive operator already uses (nmap, nuclei, Burp, Metasploit, a tmux session), rebuilt as a fast, accessible web app.

The trap with "hacker" themes is the movie version: falling green code, glitch effects on everything, skull icons, unreadable neon. Real operator tooling is the opposite. It is **monospace, dense, terse, and log-shaped**. Colour is rare and always means something. That restraint is what will make this look like a real product instead of a costume.

|                 |                                                                                                                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity**    | An offensive-ops terminal. Near-black with a faint warm bias, one signal red, everything else bone-white and grey.                                                                                                                                                            |
| **Vernacular**  | Log levels, prompts, brackets, IDs, timestamps in UTC, ASCII progress bars, redaction bars. All of these are real conventions in the tools above, used here as content, not decoration.                                                                                       |
| **Signature**   | **The prompt.** A persistent command line, `redcell:~/findings$`, that is both the command palette and a typed filter language. Type `sev:crit status:open cwe:89` and the findings table filters live. Chips and the prompt are two views of one state, mirrored in the URL. |
| **Hero moment** | **The evidence panel.** Raw request and response side by side like a Burp Repeater tab, line-numbered, the injected payload boxed in red, the leaked error underlined.                                                                                                        |
| **Name**        | **REDCELL** ("red cell" is the military and intelligence term for a red team unit). Alternatives: Breachpoint, Nightwatch, Payload.                                                                                                                                           |

## 2. Research and references

| Reference                        | What it does well                                                                                | Take                                                                                                        | Leave                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **nuclei (ProjectDiscovery)**    | CLI output tags findings as `[critical] [high] [medium]`, one per line, scannable                | Bracketed severity tags as the core severity marker                                                         | —                                                           |
| **Burp Suite Repeater**          | Request and response side by side, raw HTTP, payload in context                                  | Evidence panel layout and payload highlighting                                                              | 2010 desktop chrome                                         |
| **Metasploit / msfconsole**      | Prompt-driven, every action a typed command                                                      | The prompt as the primary power-user surface                                                                | Having _only_ a CLI                                         |
| **nmap / masscan output**        | Progress as text: `Stats: 0:04:12 elapsed; 62.00% done`                                          | ASCII progress readout under the real progress bar                                                          | —                                                           |
| **tmux / terminal multiplexers** | Status bar along the edge with session, host, clock                                              | Bottom status bar: operator, clock (UTC), API health, scans running                                         | —                                                           |
| **Wiz**                          | Benchmark for security product UI: purposeful dark, severity-tinted marks, side drawer           | Inspector drawer over the table                                                                             | Graph visualisations (no relationship data in the contract) |
| **CrowdStrike Falcon**           | Red/black/grey brand, analysts act fast on telemetry                                             | Red as the single brand chroma                                                                              | Marketing gloss                                             |
| **Linear**                       | Grey foundation, saturation only for status, 4px grid, skeletons, under 200ms transitions, Cmd+K | All of these as engineering constraints                                                                     | Purple glow, gradient art                                   |
| **Stripe tables**                | 13 to 14px, tables lead, charts only where a trend needs shape                                   | Table-first dashboard, two charts maximum                                                                   | —                                                           |
| **Declassified documents**       | Redaction bars, CONFIDENTIAL stamps, case numbers                                                | Secrets shown as redaction bars; reports styled as an ops dossier; the brief itself is stamped CONFIDENTIAL | —                                                           |

Sources: Design Monks cybersecurity examples; Wiz vs CrowdStrike comparison; 925 Studios Linear breakdown; BuildMVPFast "Linear aesthetic decoded"; Snyk vulnerability cards post; PortSwigger Burp DAST features; Mobbin cybersecurity dashboards; Raycast design notes; ProjectDiscovery nuclei output format.

### Directions set aside

- **Matrix green on black.** The most common AI-generated "hacker" look. Green also collides with "resolved", which must read as good.
- **Cyberpunk neon** (magenta, cyan, glitch on everything). Fun for one screen, exhausting for an analyst on hour six, and fails contrast and motion accessibility.
- **Calm enterprise grey** (the previous proposal). Professional but not the red-team identity you asked for.

## 3. Colour

### Rule

**Red means the attacker won.** Signal red is the brand, and it is also critical severity and the primary "launch" action. These are the same idea: an exploit, a breach, the decision to fire. Everything that is _not_ that idea stays monochrome.

### Dark theme — "Ops" (default)

| Token          | Hex                   | Role                                                   |
| -------------- | --------------------- | ------------------------------------------------------ |
| `--void`       | `#0A0A0C`             | App background                                         |
| `--panel`      | `#111014`             | Tables, cards, drawer                                  |
| `--panel-2`    | `#18161C`             | Hover row, inputs, raised                              |
| `--wire`       | `#2A2630`             | Hairline borders, grid lines                           |
| `--wire-2`     | `#3A3442`             | Strong borders, focused inputs                         |
| `--bone`       | `#ECE8E1`             | Primary text                                           |
| `--ash`        | `#8E8893`             | Secondary text                                         |
| `--smoke`      | `#5E5964`             | Tertiary text, line numbers                            |
| `--signal`     | `#FF3B4E`             | Brand, primary action, critical                        |
| `--signal-dim` | `rgba(255,59,78,.12)` | Payload highlight, selected row tint                   |
| `--live`       | `#3FD0E0`             | Running, focus ring, cursor (the "wire is hot" colour) |
| `--clear`      | `#4ADE80`             | Resolved only                                          |

### Light theme — "Dossier"

A printed operations file: cool paper, black ink, red stamp. Not the cream-and-serif look.

| Token       | Hex       |
| ----------- | --------- |
| `--void`    | `#E9EBEE` |
| `--panel`   | `#F7F8FA` |
| `--panel-2` | `#EEF0F3` |
| `--wire`    | `#D5D9DF` |
| `--wire-2`  | `#B7BDC6` |
| `--bone`    | `#0E0F12` |
| `--ash`     | `#535862` |
| `--smoke`   | `#8A909A` |
| `--signal`  | `#D0152B` |
| `--live`    | `#0B7A8A` |
| `--clear`   | `#15803D` |

### Severity

Severity is shown as a **fixed-width bracketed tag**, exactly as offensive CLI tools print it. The text carries the meaning; colour reinforces it.

```
[CRIT]   [HIGH]   [MED ]   [LOW ]   [INFO]
```

| Level    | Tag      | Dark                             | Light     |
| -------- | -------- | -------------------------------- | --------- |
| critical | `[CRIT]` | `#FF3B4E` on `--signal-dim` fill | `#D0152B` |
| high     | `[HIGH]` | `#FF8F3F`                        | `#C2570A` |
| medium   | `[MED ]` | `#F2D14C`                        | `#8F6A00` |
| low      | `[LOW ]` | `#3FD0E0`                        | `#0B7A8A` |
| info     | `[INFO]` | `--ash`                          | `--ash`   |

**Validator result.** I ran both sets through a colour-vision validator.

| Check                                 | Dark                 | Light                                    |
| ------------------------------------- | -------------------- | ---------------------------------------- |
| Colour-blind separation of neighbours | Pass (worst ΔE 10.2) | Fail (orange vs amber ΔE 1.0 for protan) |
| Normal-vision separation              | Pass (worst ΔE 15.7) | Fail (ΔE 10.0)                           |
| Contrast against surface              | Pass, all ≥ 3:1      | Pass, all ≥ 3:1                          |

No light-background red-to-amber ramp passes this, which is why severity is **never colour alone**. The four-letter tag is always present. Only critical gets a filled background, so the most important row is also distinct by shape.

### Status

Status uses a terminal glyph plus a word, so it survives greyscale.

| Status         | Render                                          |
| -------------- | ----------------------------------------------- |
| open           | `○ open` in `--bone`                            |
| confirmed      | `● confirmed` in `--signal`                     |
| resolved       | `✓ resolved` in `--clear`                       |
| false_positive | `⊘ false positive` in `--smoke`, struck through |

## 4. Typography

The type does most of the theming. Mono dominates, sans is reserved for prose that people actually read.

| Role    | Face                                            | Size / weight                       | Used for                                                   |
| ------- | ----------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Display | **Martian Mono** (Google Fonts, variable width) | 24–32 / 600, width 112, uppercase   | Screen titles, finding title on detail page, login gate    |
| Data    | **JetBrains Mono**                              | 13 / 400–500, tabular               | Tables, IDs, URLs, CWE, timestamps, tags, prompt, evidence |
| Label   | JetBrains Mono                                  | 11 / 500, uppercase, +0.1em         | Column headers, panel labels, status bar                   |
| Prose   | **IBM Plex Sans**                               | 14 / 400, line-height 1.6, max 68ch | Descriptions, remediation, form help, empty states         |

Rule: **machines speak mono, humans speak sans.** Martian Mono is the one characterful face, used only for titles. It is wide, hard-edged and unusual, and it is not the Space Mono or Share Tech that every hacker template uses.

Readout numbers on the dashboard use JetBrains Mono at 32 / 500 with tabular figures.

## 5. Layout spine

```
┌──────┬─────────────────────────────────────────────────────────────┐
│  R   │ ~/findings                                       ⌘K   ☾  op │  ← 40px context bar
│ ───  ├─────────────────────────────────────────────────────────────┤
│  ▤   │                                                             │
│  ◎   │                                                             │
│  ⚑   │                    content, edge to edge                    │
│  ▣   │                                                             │
│  ≡   │                                                             │
│  ⚙   │                                                             │
│      ├─────────────────────────────────────────────────────────────┤
│      │ redcell:~/findings$ sev:crit status:open ▌                  │  ← the prompt
├──────┴─────────────────────────────────────────────────────────────┤
│ OP analyst@redcell │ 1 SCAN LIVE │ API ● 412ms │ 2026-11-02 09:14Z │  ← status bar
└────────────────────────────────────────────────────────────────────┘
  56px icon rail
```

- **Icon rail**, 56px, labels on hover and focus, collapses to a bottom tab bar under 768px.
- **Context bar** shows the path as a working directory (`~/findings/fnd_5231`), which doubles as the breadcrumb.
- **The prompt** sits above the status bar on every screen. `/` or `⌘K` focuses it.
- **Status bar** like tmux: current operator, live scan count, mock API health and last latency, UTC clock.
- Corners: 2px on controls, 4px on panels. Square and sharp suits the theme, but not zero, so it does not read as the broadsheet default.
- 4px spacing grid. Dense rows are 36px, forms 40px.

## 6. The signature: the prompt

The prompt is a typed filter language and a command runner. It is the single most memorable thing in the product, and it directly strengthens the 20% findings-screen criterion.

### Grammar

```
filter    := term (" " term)*
term      := key ":" value ("," value)*  |  free-text
key       := sev | status | cat | cwe | target | scan | sort | page
examples  :
  sev:crit,high status:open
  cwe:89 target:"Acme Store"
  cat:A03 sort:-date sql injection
```

### Commands

```
goto findings | targets | scans | reports | settings
scan <target>          launches a new scan
open fnd_5231          opens a finding
export csv             exports the current filtered view
theme dark | light
help                   lists everything
```

### Behaviour

- Parsed as you type into a typed `FindingsQuery` object. Invalid tokens are underlined in `--signal` with an inline hint, never a blocking error.
- The same `FindingsQuery` drives the filter chips and the URL search params. Click a chip and the prompt text updates; type in the prompt and the chips update. One source of truth, three views.
- Autocomplete lists keys, then valid values with counts (`sev:crit  4`).
- History with ↑ and ↓.
- Everything the prompt does is also reachable with buttons and chips, so it is a power-user layer, not a barrier.

## 7. Screen by screen

Every list has designed **loading**, **empty** and **error** states.

- **Loading** is a skeleton in the exact row geometry, with a single line of mono text such as `> fetching /api/findings ...`.
- **Empty** is one line in the log voice and the next action, for example `0 findings match sev:crit cwe:22`, then `Clear filters`.
- **Error** says what failed and offers a retry, for example `ERR 503 /api/reports — the reports service did not answer.`, then `Retry`.

### 01 · `/login` — Access gate

```
┌──────────────────────────────┬──────────────────────────────┐
│ [ boot log, types in once ]  │  ACCESS GATE                 │
│ > redcell v2.6.0             │                              │
│ > loading modules ...... ok  │  operator email              │
│ > tls handshake ........ ok  │  [__________________]        │
│ > awaiting operator ▌        │  passphrase                  │
│                              │  [__________________] ◉      │
│ AUTHORISED TARGETS ONLY.     │                              │
│ Every scan is logged.        │  [ AUTHENTICATE ]            │
│                              │  demo: op@redcell.io / ...   │
└──────────────────────────────┴──────────────────────────────┘
```

- The boot log is the **one ambient animation** in the app. It types once in about 1.2s, skips on any key, and is static under reduced motion.
- Inline validation on blur. Bad credentials show `ACCESS DENIED — email or passphrase is wrong.` in red under the button.
- On success, a fake token goes to the auth store and the user lands on the dashboard. All other routes redirect here.

### 02 · `/dashboard` — Situation report

```
┌ SITREP ─────────────────────────────────────────────────────┐
│ TARGETS  6   │ OPS RUN  12   │ OPEN  27   │ [CRIT]  4        │  ← each links to a filtered view
├──────────────────────────────┬──────────────────────────────┤
│ OPEN BY SEVERITY             │ NEW FINDINGS / DAY · 14d     │
│ ████████▌██████▌████▌██▌▏    │      ┌┐    ┌─┐  ┌┐           │
│ CRIT 4 HIGH 9 MED 8 LOW 5    │ ┌──┐┌┘└┐┌──┘ └──┘└┐ ●        │
├──────────────────────────────┴──────────────────────────────┤
│ RECENT OPS                                                  │
│ ● scan_119 Acme Store   [#######.....] 62%   04:12          │
│ ✓ scan_118 Billing API  CRIT 1 HIGH 2 MED 3 LOW 1   12:22   │
└─────────────────────────────────────────────────────────────┘
```

- Readouts count up once on first load (900ms), then stay still.
- Chart 1 is a horizontal stacked bar with 2px gaps and direct labels, because a donut hides magnitude.
- Chart 2 is a stepped line, because daily counts are discrete. The last point is emphasised.
- Clicking any readout or bar segment goes to `/findings?sev=crit` and so on, and the prompt shows the matching query. **The dashboard teaches the filter language.**

### 03 · `/targets` — Target list

```
TARGETS                                              [ + ADD TARGET ]
NAME            URL                         ENV    LAST SCAN   OPEN
Acme Store      https://shop.example.com    [STG]  2h ago      CRIT 1 HIGH 2 ...   ⋯
Billing API     https://api.billing.io      [PRD]  1d ago      HIGH 3              ⋯
```

- Environment as a bracketed tag: `[PRD]` in signal red outline, `[STG]` in amber outline, `[DEV]` in grey. Production is red because that is where a breach costs the most.
- Add and edit share one modal, titled `NEW TARGET` or `EDIT tgt_03`.
- The "authenticated scan" switch reveals username and password with a 150ms height transition. The saved password is shown as a redaction bar `████████`.
- Remove asks inline in the row: `Remove Acme Store? [ CONFIRM ] [ CANCEL ]`. No second modal.
- Optimistic update. If the mock API fails, the row snaps back and a toast explains why.

### 04 · `/scans` — Operations log

```
OPERATIONS                       [all] [running] [queued] [done] [failed]   [ ▶ NEW SCAN ]
● RUN   scan_119  Acme Store     09:00Z   04:12   [#######.....] 62%  > crawling /checkout
○ QUE   scan_120  Docs Portal    —        —       queued, position 1
✓ DONE  scan_118  Billing API    08:41Z   12:22   CRIT 1 HIGH 2 MED 3 LOW 1          →
✕ FAIL  scan_117  Partner API    07:10Z   00:38   ERR target refused connection
```

- A running scan shows a real progress bar, an ASCII readout and a one-line log tail that changes each tick (`> crawling /checkout`, `> fuzzing q param`). The progress advances on a timer.
- The live dot is the `--live` colour with a slow pulse. It is the only pulsing thing in the app.
- Findings count is a mini severity strip, not a single number.
- A completed row opens `/findings?scan=scan_118`.
- "New scan" opens a small dialog to pick a target. It can also be run as `scan acme` in the prompt.

### 05 · `/findings` — Centrepiece

```
~/findings                                                   43 total
[ search ... ]  SEV [CRIT 4][HIGH 9][MED][LOW][INFO]  CAT ▾  STATUS ▾  VIEW: needs-triage ▾  [CSV]
┌───┬────────┬──────────────────────────────────┬───────────┬────────┬────────────┬────────────┬──────────┐
│ □ │ SEV ↓  │ TITLE                            │ CATEGORY  │ CWE    │ TARGET     │ STATUS     │ FOUND    │
├───┼────────┼──────────────────────────────────┼───────────┼────────┼────────────┼────────────┼──────────┤
│ □ │ [CRIT] │ SQL injection in product search  │ A03 Inj.  │ CWE-89 │ Acme Store │ ● confirmed│ 02-18 09:06│
│   │        │ GET /search?q=                   │           │        │            │            │          │
│ □ │ [HIGH] │ Reflected XSS in order status    │ A03 Inj.  │ CWE-79 │ Acme Store │ ○ open     │ 02-17 22:41│
└───┴────────┴──────────────────────────────────┴───────────┴────────┴────────────┴────────────┴──────────┘
 showing 1–20 of 27 · query: sev:crit,high status:open        ‹ 1 [2] 3 ›   rows: 20 ▾
redcell:~/findings$ sev:crit,high status:open ▌
```

- **Search, filter, sort and pagination all combine**, and all live in the URL. Reload, share or press back and the view is intact.
- Every column header sorts, with `aria-sort` and an arrow. Shift-click adds a secondary sort.
- Filter chips show live counts for the current query, so the analyst sees what each click will do.
- Clicking a row opens the **inspector drawer** (520px, right side) and the URL becomes `/findings/fnd_5231`. The table stays visible behind it. A direct visit to that URL renders the full page instead.
- Keyboard: `j` and `k` move the selection, `Enter` opens, `Esc` closes, `x` toggles the checkbox, `1` to `4` set status.
- Selecting rows reveals a bulk bar: `3 selected  [ CONFIRM ] [ RESOLVE ] [ FALSE POSITIVE ]`.
- Saved views store a named query string (for example `needs-triage = status:open sev:crit,high`).
- CSV export uses the current filtered and sorted view.
- Performance: the filter pipeline is a pure function, memoised on the query and the data. 43 rows paginate at 20, so virtualisation is not needed. The design allows it later.

### 06 · `/findings/:id` — Finding detail

```
~/findings/fnd_5231
[CRIT]  SQL INJECTION IN PRODUCT SEARCH                       ┌ META ─────────────────┐
A03: Injection · CWE-89 ↗                                     │ TARGET  Acme Store    │
                                                              │ URL     shop.example… │
STATUS  ( open )──( ● confirmed )──┬─( resolved )             │ LOC     GET /search?q=│
                                   └─( false positive )       │ SCAN    scan_118      │
                                                              │ FOUND   2026-02-18    │
DESCRIPTION                                                   │         09:06Z        │
User input in the q parameter reaches the database query...   └───────────────────────┘

EVIDENCE ─────────────────────────────────────────────────────────────────────────────
┌ REQUEST ───────────────────────── [copy] ┬ RESPONSE ──────────────────────── [copy] ┐
│ 1  GET /search?q=test┌%27┐ HTTP/1.1      │ 1  HTTP/1.1 500 Internal Server Error    │
│ 2  Host: shop.example.com                │ 2  Content-Type: text/html               │
│ 3  Cookie: session=████████              │ 3                                        │
│                                          │ 4  ...error in your SQL syntax near ''   │
└──────────────────────────────────────────┴──────────────────────────────────────────┘

REMEDIATION ────────────────────────────────────────────────────────────────────────
Use parameterised queries. Validate and encode input.
```

- Reading order answers the analyst's questions in sequence: **what, where, proof, fix**.
- The title is the one place Martian Mono runs large.
- The status control is a stepper that shows the real state machine: open, then confirmed, then a fork to resolved or false positive. The current state is filled. Changes update the client store and persist for the session.
- In the evidence panel, the payload is boxed in signal red, error lines are underlined in amber, and cookies and tokens are redacted by default with a reveal toggle. Panes scroll horizontally on their own and never stretch the page.
- The CWE links to the MITRE page.

### 07 · `/reports` and `/settings`

```
REPORTS                                                  [ GENERATE REPORT ]
ID       TARGET        SCAN       FINDINGS                 CREATED
rpt_09   Acme Store    scan_118   CRIT 1 HIGH 2 MED 3 LOW 1  02-18 10:00   [ ↓ PDF ]
```

- Reports are styled as dossier entries with a case number. "Generate report" opens a dialog that lists completed scans only.
- "Download PDF" creates a small dummy file and shows a toast: `rpt_09.pdf downloaded`.
- **This is the mock endpoint that fails.** It fails one time in three, and the error state shows how failure is handled.

```
SETTINGS
OPERATOR      name, email, role
THEME         ( system ) ( ops · dark ) ( dossier · light )      persists in localStorage
CRT MODE      [ off ]   faint scanlines and phosphor glow, off by default
API KEY       rc_live_████████████████  [ reveal ] [ copy ] [ regenerate ]
```

- **CRT mode** is an opt-in easter egg for the full hacker feel. It is off by default and always disabled under reduced motion, so the default UI stays clean and readable.

## 8. Motion budget

Six moments. Nothing else moves. All are removed under `prefers-reduced-motion`.

| #   | Moment                                                             | Duration                       |
| --- | ------------------------------------------------------------------ | ------------------------------ |
| 1   | Login boot log types once                                          | about 1.2s, skippable          |
| 2   | Dashboard readouts count up                                        | 900ms, ease-out                |
| 3   | Prompt cursor blinks                                               | 1s steps, only while focused   |
| 4   | Running scan: bar advance, ASCII readout, log tail, live dot pulse | continuous, only while running |
| 5   | Drawer slides in                                                   | 180ms                          |
| 6   | Status stepper fills                                               | 150ms                          |

Deliberately excluded: glitch effects, matrix rain, typing effects on every heading, and parallax.

## 9. Accessibility

- Severity and status are never colour alone. Every one has a text tag or glyph and a word.
- Body text contrast: `--bone` on `--void` is about 16:1, and `--ash` on `--void` is about 5.8:1. Signal red as text on `--void` is about 5.3:1, which passes AA.
- The focus ring is a 2px `--live` cyan outline with a 2px offset, always visible. Cyan is used because red focus would look like an error.
- Landmarks are `nav`, `header`, `main` and a `footer` for the status bar. Tables have a `caption`. Sortable headers have `aria-sort`. The drawer is `role="dialog"` with a focus trap.
- The prompt is a labelled `combobox` with an `aria-live` region announcing result counts.
- The whole app works by keyboard. `?` opens a shortcut sheet.
- Under 768px, the rail becomes a bottom tab bar, the findings table becomes stacked cards, and the evidence panes stack vertically.

## 10. How the design maps to the grading

| Criterion                           | Weight | How this design earns it                                                                                                                   |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Findings screen                     | 20%    | URL-synced combined filters, the prompt query language, chip counts, sort on every column, keyboard triage, bulk actions, saved views, CSV |
| UX, visual craft, consistency       | 20%    | One rule for colour, one rule for type, one vernacular across all seven screens                                                            |
| Code quality, structure, TypeScript | 20%    | See section 11                                                                                                                             |
| Completeness and states             | 15%    | Every list has designed loading, empty and error states in the log voice                                                                   |
| Accessibility                       | 10%    | Tags not colour, AA contrast, visible focus, landmarks, full keyboard                                                                      |
| State and mock API                  | 10%    | TanStack Query plus MSW with latency and a failing endpoint, optimistic updates with rollback                                              |
| README, commits, demo               | 5%     | Small commits per feature, README explains each choice                                                                                     |

## 11. Engineering implications

| Concern           | Decision                                                                                                                    | Why                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Tokens            | CSS variables in `src/styles/tokens.css`, mapped in `tailwind.config.ts`                                                    | One source of truth. The theme toggle flips `data-theme` on `<html>`, and charts read the same variables. |
| Server state      | TanStack Query                                                                                                              | Built-in loading, error and retry, cache invalidation and optimistic updates match the brief exactly      |
| Client state      | Zustand with `persist`                                                                                                      | Token, theme, CRT mode, finding status overrides, saved views, prompt history                             |
| Mock API          | MSW, 300–800ms random latency, `/api/reports` fails 1 in 3                                                                  | A real network layer in the browser, swappable for the real backend later                                 |
| Query language    | A pure `parseQuery(string) → FindingsQuery` and `serializeQuery(FindingsQuery) → string`, round-trip tested                 | Keeps the signature feature correct and unit-testable                                                     |
| Findings pipeline | A pure `applyQuery(findings, query)`, memoised with `useMemo`                                                               | Filter, sort and paginate in one tested function                                                          |
| Table             | TanStack Table, headless                                                                                                    | Sorting and pagination logic without imposing visuals                                                     |
| Primitives        | Radix: Dialog, DropdownMenu, Switch, Tooltip, Toast, Popover                                                                | Permitted by the brief, and accessible by default                                                         |
| Charts            | Hand-rolled SVG for the two dashboard charts                                                                                | Small, matches the mark specs exactly, and themes through tokens                                          |
| Forms             | React Hook Form + Zod                                                                                                       | Typed schemas with inline errors                                                                          |
| Tests             | Vitest for the parser, serializer and `applyQuery`                                                                          | Covers the logic the grade depends on most                                                                |
| Lint              | ESLint + Prettier + `tsc --noEmit` in CI                                                                                    | Required by the brief                                                                                     |
| Structure         | `src/features/{auth,dashboard,targets,scans,findings,reports,settings,prompt}`, `src/components/ui`, `src/mocks`, `src/lib` | Feature folders keep ownership clear                                                                      |

### Build order

The order follows the brief's weighting.

1. Tokens and app shell (rail, context bar, status bar)
2. Mock data and MSW
3. Findings table and query engine
4. The prompt
5. Finding detail
6. Dashboard
7. Login
8. Targets
9. Scans
10. Reports and settings
11. Stretch goals

## 12. Decisions needed

|     | Decision                                    | Recommended                                            | Alternatives                               |
| --- | ------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| A   | Approve the red-team ops-terminal direction | Yes                                                    | —                                          |
| B   | Product name                                | REDCELL                                                | Breachpoint, Nightwatch, Payload           |
| C   | Signature feature                           | The prompt with a typed filter language                | Chips only, no prompt                      |
| D   | Default theme                               | Ops (dark), with Dossier (light) as a designed sibling | Follow the system setting                  |
| E   | Findings interaction                        | Drawer plus a full page at the same URL                | Full page only                             |
| F   | Display face                                | Martian Mono                                           | Chakra Petch, or JetBrains Mono everywhere |
| G   | CRT mode easter egg                         | Include, off by default                                | Leave out                                  |
