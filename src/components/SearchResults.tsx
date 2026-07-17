import { useEffect, useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { SearchStatus } from '../hooks/useProductSearch'
import type { Product } from '../types/product'
import { ResultItem } from './ResultItem'

interface SearchResultsProps {
  status: SearchStatus
  products: Product[]
  total: number
  error: string | null
  query: string
  /** id of the listbox, referenced by the input's aria-controls. */
  listboxId: string
  /** Builds the id for option N — shared with the input's aria-activedescendant. */
  getOptionId: (index: number) => string
  activeIndex: number
  onSelect: (product: Product) => void
  onHover: (index: number) => void
  onRetry: () => void
}

/** Estimated row height (px) — px-3 py-2 around a 40px thumbnail. */
const ROW_HEIGHT = 56

/** Shared dropdown shell so every state looks like the same panel. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <span
      className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"
      aria-hidden="true"
    />
  )
}

interface ResultsListProps {
  products: Product[]
  listboxId: string
  getOptionId: (index: number) => string
  activeIndex: number
  isBusy: boolean
  onSelect: (product: Product) => void
  onHover: (index: number) => void
}

/**
 * The virtualized listbox. Only the rows in (and near) the viewport are in the
 * DOM; a full-height sizer keeps the scrollbar honest. Lives in its own
 * component so the virtualizer's hooks run only when results actually render.
 */
function ResultsList({
  products,
  listboxId,
  getOptionId,
  activeIndex,
  isBusy,
  onSelect,
  onHover,
}: ResultsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
  })

  // Keep the keyboard-highlighted option in view. With virtualization the active
  // row may not be in the DOM, so we use the virtualizer's API — not
  // getElementById().scrollIntoView() — to bring it into the window.
  useEffect(() => {
    if (activeIndex >= 0) {
      virtualizer.scrollToIndex(activeIndex, { align: 'auto' })
    }
  }, [activeIndex, virtualizer])

  return (
    <div
      ref={scrollRef}
      id={listboxId}
      role="listbox"
      aria-label="Search results"
      aria-busy={isBusy}
      className="max-h-80 overflow-y-auto"
    >
      {/* Full-height sizer for the scrollbar. role=presentation keeps the
          listbox→option relationship intact despite the wrapper element. */}
      <div
        role="presentation"
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const product = products[row.index]
          return (
            <ResultItem
              key={product.id}
              product={product}
              id={getOptionId(row.index)}
              isActive={row.index === activeIndex}
              posInSet={row.index + 1}
              setSize={products.length}
              onSelect={onSelect}
              onHover={() => onHover(row.index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: row.size,
                transform: `translateY(${row.start}px)`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export function SearchResults({
  status,
  products,
  total,
  error,
  query,
  listboxId,
  getOptionId,
  activeIndex,
  onSelect,
  onHover,
  onRetry,
}: SearchResultsProps) {
  if (status === 'error') {
    return (
      <Panel>
        <div className="px-3 py-4 text-sm">
          <p className="text-red-600 dark:text-red-400">
            {error ?? 'Something went wrong.'}
          </p>
          <button
            type="button"
            // preventDefault keeps focus in the input; onClick does the retry.
            onMouseDown={(event) => event.preventDefault()}
            onClick={onRetry}
            className="mt-2 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
          >
            Try again
          </button>
        </div>
      </Panel>
    )
  }

  // First-load spinner (no previous results to keep on screen).
  if (status === 'loading' && products.length === 0) {
    return (
      <Panel>
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
          <Spinner />
          Searching…
        </div>
      </Panel>
    )
  }

  if (status === 'success' && products.length === 0) {
    return (
      <Panel>
        <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
          No products found for “{query}”.
        </p>
      </Panel>
    )
  }

  // Results (status success, or loading while previous results stay visible).
  return (
    <Panel>
      <ResultsList
        products={products}
        listboxId={listboxId}
        getOptionId={getOptionId}
        activeIndex={activeIndex}
        isBusy={status === 'loading'}
        onSelect={onSelect}
        onHover={onHover}
      />
      <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        {total > products.length
          ? `Showing ${products.length} of ${total} results`
          : `${total} result${total === 1 ? '' : 's'}`}
      </p>
    </Panel>
  )
}
