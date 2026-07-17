# Product Search

An accessible, production-minded **product search** component built in React +
TypeScript. Type a query and get a live dropdown of matching products, backed by
the [DummyJSON](https://dummyjson.com) search API.

It's implemented as a **WAI-ARIA combobox** with debounced requests, in-flight
request cancellation, full keyboard support, and a screen-reader-friendly
interaction model.

## Features

- **Debounced search** — one request per typing pause, not per keystroke.
- **Race-safe** — each new query aborts the previous in-flight request, so the
  latest query always wins (no stale results).
- **Virtualized results** — fetches the full match set (`limit=0`, trimmed
  `select` payload) but only ~12 rows are ever in the DOM, via
  `@tanstack/react-virtual` — so hundreds of results stay smooth.
- **Full keyboard support** — ↑/↓ (with wrap), Home/End, Enter, Escape, Tab.
- **Accessible** — combobox roles, `aria-activedescendant` virtual focus, a live
  region for result announcements, and an `sr-only` label.
- **Every state handled** — idle, loading, results, empty, and error (with retry).

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** (build / dev server)
- **Tailwind CSS v4** (styling)
- **@tanstack/react-virtual** (list virtualization)
- **ESLint** (linting)

## Prerequisites

- **Node.js `20.19.0`** (or any `^20.19 || ^22.13 || >=24`).
  The exact version is pinned in [`.nvmrc`](.nvmrc). If you use `nvm`:

  ```bash
  nvm install   # installs the version in .nvmrc
  nvm use
  ```

  > ⚠️ Node older than `20.19` fails to install the native build binary
  > (Vite 8 / rolldown engine requirement) and the build will crash.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

## Available scripts

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot-module reload. |
| `npm run build`   | Type-check (`tsc -b`) and build for production.    |
| `npm run preview` | Serve the production build locally.               |
| `npm run lint`    | Run ESLint over the project.                      |

## Project structure

```
src/
├─ types/
│  └─ product.ts            # API response types
├─ hooks/
│  ├─ useDebouncedValue.ts  # generic value debounce
│  ├─ useFetch.ts           # generic: fetch + abort + race-safety + keep-previous
│  ├─ useProductSearch.ts   # data: builds the URL, maps response to a status machine
│  └─ useCombobox.ts        # behaviour: open/close, active index, keyboard
├─ components/
│  ├─ SearchBar.tsx         # the combobox: ARIA wiring + markup
│  ├─ SearchResults.tsx     # dropdown panel + virtualized results list
│  └─ ResultItem.tsx        # a single result row (option)
├─ App.tsx                  # mounts the search component
└─ main.tsx                 # app entry
```

The architecture separates concerns into layers: generic **data** (`useFetch`),
domain **data** (`useProductSearch`), **behaviour** (`useCombobox`, a headless
hook), and **presentation** (the components) — the same pattern used by libraries
like Downshift and React Aria.

## API

The component calls:

```
GET https://dummyjson.com/products/search?q={query}&limit=0&select=title,price,thumbnail,brand,category
```

`limit=0` returns all matches (the list is virtualized on the client). No API key
or environment configuration is required.

## Accessibility

Built to the [WAI-ARIA APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/):
DOM focus stays on the input while options are navigated virtually via
`aria-activedescendant`, result counts are announced through a polite live
region, and the widget is fully operable by keyboard.

Because the list is virtualized (only a slice of rows is in the DOM), each option
also carries `aria-setsize`/`aria-posinset` so screen readers announce the true
"N of M", and the active row is kept scrolled into view via the virtualizer.

## AI tooling

See [`AI-tools-usage.md`](AI-tools-usage.md) for how AI tools were used during
development, plus the problems encountered and how they were resolved.
