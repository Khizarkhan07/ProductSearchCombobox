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
- **Bounded result set** — the API is asked for only `limit=8` rows with a
  trimmed `select` payload; the true match count is shown as _"Showing 8 of N"_.
- **Full keyboard support** — ↑/↓ (with wrap), Home/End, Enter, Escape, Tab.
- **Accessible** — combobox roles, `aria-activedescendant` virtual focus, a live
  region for result announcements, and an `sr-only` label.
- **Every state handled** — idle, loading, results, empty, and error (with retry).

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** (build / dev server)
- **Tailwind CSS v4** (styling)
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
├─ lib/
│  └─ searchProducts.ts     # fetch client (URL, AbortSignal, error handling)
├─ hooks/
│  ├─ useDebouncedValue.ts  # generic value debounce
│  ├─ useProductSearch.ts   # data: debounce + abort + derived state machine
│  └─ useCombobox.ts        # behaviour: open/close, active index, keyboard
├─ components/
│  ├─ SearchBar.tsx         # the combobox: ARIA wiring + markup
│  ├─ SearchResults.tsx     # dropdown panel (loading / error / empty / results)
│  └─ ResultItem.tsx        # a single result row
├─ App.tsx                  # mounts the search component
└─ main.tsx                 # app entry
```

The architecture separates three concerns: **data** (`useProductSearch`),
**behaviour** (`useCombobox`, a headless hook), and **presentation** (the
components) — the same pattern used by libraries like Downshift and React Aria.

## API

The component calls:

```
GET https://dummyjson.com/products/search?q={query}&limit=8&select=title,price,thumbnail,brand,category
```

No API key or environment configuration is required.

## Accessibility

Built to the [WAI-ARIA APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/):
DOM focus stays on the input while options are navigated virtually via
`aria-activedescendant`, result counts are announced through a polite live
region, and the widget is fully operable by keyboard.

## AI tooling

See [`AI-tools-usage.md`](AI-tools-usage.md) for how AI tools were used during
development, plus the problems encountered and how they were resolved.
