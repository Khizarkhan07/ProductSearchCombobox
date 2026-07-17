import { useCallback, useState, type KeyboardEvent } from 'react'

interface UseComboboxOptions {
  itemCount: number
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


export function useCombobox({
  itemCount,
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
        case 'ArrowDown':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            return
          }
          if (itemCount === 0) return
          setActiveIndex((i) => (i + 1) % itemCount)
          break
        case 'ArrowUp':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
            return
          }
          if (itemCount === 0) return
          setActiveIndex((i) => (i <= 0 ? itemCount - 1 : i - 1))
          break
        case 'Home':
          if (itemCount === 0) return
          event.preventDefault()
          setActiveIndex(0)
          break
        case 'End':
          if (itemCount === 0) return
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
    [isOpen, itemCount, activeIndex, onSelect, close],
  )

  return { isOpen, activeIndex, open, close, setActiveIndex, handleKeyDown }
}
