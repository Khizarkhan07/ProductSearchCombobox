import { useCallback, useState, type KeyboardEvent } from 'react'

interface UseComboboxOptions {
  itemCount: number
  /** Number of columns in the grid layout. 1 = a plain vertical list. */
  columns?: number
  onSelect: (index: number) => void
}

interface UseComboboxResult {
  isOpen: boolean
  /** Index of the virtually-focused option, or -1 for none. */
  activeIndex: number
  open: () => void
  close: () => void
  setActiveIndex: (index: number) => void
  handleKeyDown: (event: KeyboardEvent) => void
}

/**
 * Computes the next active index for an arrow key over a row-major grid.
 * Left/Right traverse in reading order — Right at a row's end continues to the
 * next row's first cell, Left at a row's start goes back to the previous row's
 * last cell — clamped at the first/last item. Up/Down move by whole rows,
 * clamped, with an odd-last-row guard.
 */
function nextGridIndex(
  current: number,
  key: string,
  itemCount: number,
  columns: number,
): number {
  // Entering the list from the input (no active option yet).
  if (current < 0) {
    return key === 'ArrowUp' ? itemCount - 1 : 0
  }

  const lastRowStart = Math.floor((itemCount - 1) / columns) * columns

  switch (key) {
    case 'ArrowRight':
      return current + 1 < itemCount ? current + 1 : current
    case 'ArrowLeft':
      return current - 1 >= 0 ? current - 1 : current
    case 'ArrowDown':
      // Move down a row; if that row is short, land on the last item.
      return current < lastRowStart
        ? Math.min(current + columns, itemCount - 1)
        : current
    case 'ArrowUp':
      return current - columns >= 0 ? current - columns : current
    default:
      return current
  }
}

export function useCombobox({
  itemCount,
  columns = 1,
  onSelect,
}: UseComboboxOptions): UseComboboxResult {
  const [isOpen, setIsOpen] = useState(false)
  // -1 means "no option highlighted" (focus stays on the input).
  const [activeIndex, setActiveIndex] = useState(-1)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        // Up/Down always drive the list (and open it when closed).
        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            return
          }
          if (itemCount === 0) return
          setActiveIndex((i) => nextGridIndex(i, event.key, itemCount, columns))
          break

        // Left/Right + Home/End only navigate once an option is active —
        // otherwise they belong to the text caret in the input.
        case 'ArrowLeft':
        case 'ArrowRight':
          if (!isOpen || activeIndex < 0) return
          event.preventDefault()
          setActiveIndex((i) => nextGridIndex(i, event.key, itemCount, columns))
          break
        case 'Home':
          if (!isOpen || activeIndex < 0) return
          event.preventDefault()
          setActiveIndex(0)
          break
        case 'End':
          if (!isOpen || activeIndex < 0) return
          event.preventDefault()
          setActiveIndex(itemCount - 1)
          break

        case 'Enter':
          if (activeIndex >= 0 && activeIndex < itemCount) {
            event.preventDefault()
            onSelect(activeIndex)
            close()
          }
          break
        case 'Escape':
          if (isOpen) {
            event.preventDefault()
            close()
          }
          break
        case 'Tab':
          // No preventDefault: focus must move on naturally.
          close()
          break
      }
    },
    [isOpen, itemCount, columns, activeIndex, onSelect, close],
  )

  return { isOpen, activeIndex, open, close, setActiveIndex, handleKeyDown }
}
