import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `value` has
 * stopped changing for `delayMs`
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    // Cleanup runs before the next effect, every new key stoke cancels previous pending state
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
