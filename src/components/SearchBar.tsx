import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useCombobox } from '../hooks/useCombobox'
import { useProductSearch } from '../hooks/useProductSearch'
import type { Product } from '../types/product'
import { SearchResults } from './SearchResults'

interface SearchBarProps {
  onProductSelect?: (product: Product) => void
}

export function SearchBar({ onProductSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const { status, products, total, error, retry } = useProductSearch(query)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Stable, unique ids so aria wiring survives multiple instances on a page.
  const baseId = useId()
  const inputId = `${baseId}-input`
  const listboxId = `${baseId}-listbox`
  const getOptionId = useCallback(
    (index: number) => `${baseId}-option-${index}`,
    [baseId],
  )

  const navigableCount = status !== 'error' ? products.length : 0

  const handleSelect = useCallback(
    (product: Product) => {
      setQuery(product.title)
      inputRef.current?.focus()
      onProductSelect?.(product)
    },
    [onProductSelect],
  )

  const { isOpen, activeIndex, open, close, setActiveIndex, handleKeyDown } =
    useCombobox({
      itemCount: navigableCount,
      onSelect: (index) => handleSelect(products[index]),
    })

  // The popup is visible only when open AND there is something to show.
  const showPanel = isOpen && status !== 'idle'
  const activeOptionId =
    activeIndex >= 0 && activeIndex < navigableCount
      ? getOptionId(activeIndex)
      : undefined

  // Close when a pointer press lands outside the whole widget.
  useEffect(() => {
    if (!isOpen) return
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        close()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen, close])

  // (Scrolling the active option into view now lives in SearchResults, which
  // owns the virtualizer — a virtualized row may not be in the DOM to query.)

  const liveMessage =
    status === 'success'
      ? products.length > 0
        ? `${total} results found.`
        : 'No products found.'
      : status === 'error'
        ? 'Search failed.'
        : ''

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>

      
      <svg
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="M14 14l4 4" strokeLinecap="round" />
      </svg>

      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        autoComplete="off"
        placeholder="Search products…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(-1)
          open()
        }}
        onFocus={open}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-white/10"
      />

      {query.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          // preventDefault keeps focus in the input after clearing.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setQuery('')
            close()
            inputRef.current?.focus()
          }}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <svg
            className="size-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {showPanel && (
        <SearchResults
          status={status}
          products={products}
          total={total}
          error={error}
          query={query}
          listboxId={listboxId}
          getOptionId={getOptionId}
          activeIndex={activeIndex}
          onSelect={(product) => {
            handleSelect(product)
            close()
          }}
          onHover={setActiveIndex}
          onRetry={retry}
        />
      )}

      {/* Screen-reader-only status announcements. */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </div>
    </div>
  )
}
