# AI Tools Usage

Documentation of AI tooling used to build this product-search component, plus
the problems hit along the way and how they were resolved — as requested by the
task brief.

## Tools used

- **Claude Code** (Anthropic's CLI coding agent, Opus / Sonnet models) — used as a
  pair-programmer to accelerate boilerplate and to reason through design tradeoffs
  and accessibility, not as an autonomous code generator.

## How the AI was used

The implementation was **developer-led**. I owned the architecture and every
decision; Claude Code was a tool used at specific points, and its output was
reviewed, adapted, and in places rewritten by hand before being accepted.

1. **Planning first (my direction).** I inspected the live API response shape, set
   the architecture (a custom data hook + presentational components + a WAI-ARIA
   combobox), and made the open calls myself — Tailwind v4, a hand-rolled data
   layer over a library, and the scope — before any component code was written.

2. **Iterative build with review at each step.** Each part — types, API client,
   hooks, presentational components, the combobox, wiring — was built, read line by
   line, questioned, and revised. Several design choices came out of that
   back-and-forth rather than being taken as-is, for example:
   - **deriving** `status` instead of storing it, after I flagged the cascading warning;
   - **co-locating** module constants vs. a global constants file;
   - dropping **SWR** once I established it doesn't actually cancel requests;
   - extracting a **headless `useCombobox` hook** to separate behaviour from data and markup.

Every non-trivial line is understood and defensible — nothing was accepted without
knowing why it's there.

## Problems encountered & resolutions

### 1. Build crash — `rolldown` native binding not found
- **Symptom:** `Error: Cannot find native binding` / `Cannot find module '@rolldown/binding-darwin-arm64'` on `vite build`.
- **Cause:** Node **20.17.0** did not satisfy the engine requirement of Vite 8 / rolldown
  (`^20.19.0 || ^22.13.0 || >=24`). npm **silently skips** optional native-binary packages
  when the engine check fails — so the platform binding was never installed. (The error's
  own hint about the npm optional-deps bug was a red herring; a clean reinstall alone
  didn't fix it.)
- **Resolution:** `nvm install 20.19.0` + clean reinstall, and pinned the version with an
  `.nvmrc` so the environment is reproducible.

### 2. React warning — "Calling setState synchronously within an effect (cascading renders)"
- **Symptom:** lint/runtime warning in `useProductSearch` where the effect set `status`
  synchronously.
- **Cause:** the hook was **storing** `status` (`loading`/`idle`/…) and updating it inside the
  effect body, causing extra render passes.
- **Resolution:** refactored to **derive** `status` during render from the raw data (a
  query-tagged `result` and `error`). The effect now only calls `setState` inside async
  `.then`/`.catch` callbacks. Result: no synchronous setState, no cascading renders, and
  `status` can no longer desync from the data.

### 3. Library misconception — "does SWR provide native request abort?"
- **Question raised:** could SWR remove the need to write cancellation ourselves?
- **Finding:** SWR does **not** cancel in-flight requests — it guarantees correctness by
  *discarding* stale responses, but the network request still completes. **TanStack Query**
  is the library with a native `AbortSignal` passed to the query function.
- **Resolution:** chose a **hand-rolled `useProductSearch`** with `AbortController` to both
  cancel the request and win the race — and to demonstrate the underlying mechanics. In
  production, TanStack Query would be a reasonable choice for its native abort, caching,
  and dedupe.

## Key design decisions

- **Handling "hundreds of results" at the source:** the API request uses `limit=8` and
  `select=title,price,thumbnail,brand,category`, so the dropdown never fetches or renders
  a huge list. The true match count is surfaced as "Showing 8 of N results".
- **Request control:** 300ms debounce collapses typing bursts into one request; an
  `AbortController` cancels the previous in-flight request on each new query, eliminating
  the stale-response race condition.
- **Accessibility:** implemented as a WAI-ARIA **combobox** using the `aria-activedescendant`
  pattern (DOM focus stays on the input; the active option is virtual). Full keyboard
  support (↑/↓ with wrap, Home/End, Enter, Escape, Tab), a polite `aria-live` region for
  result-count announcements, and an `sr-only` `<label>` for the accessible name.
- **Derived state machine:** `idle | loading | success | error` is derived, not stored —
  a single source of truth that can't contradict the data.
- **Separation of concerns (headless hook):** the generic combobox behaviour (open/close,
  active-index, keyboard contract) lives in a reusable `useCombobox` hook that is unaware
  of products; `useProductSearch` owns the data; `SearchBar` owns only the ARIA wiring and
  markup. Same architecture as headless libraries (Downshift / React Aria).
