import { useCallback, useEffect, useState } from 'react'
import { searchProducts } from '../lib/searchProducts'
import type { Product } from '../types/product'
import { useDebouncedValue } from './useDebouncedValue'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 1
const RESULT_LIMIT = 8

/** A successful response, tagged with the query it belongs to. */
interface Result {
  query: string
  products: Product[]
  total: number
}

/** A failed response, tagged with the query it belongs to. */
interface SearchError {
  query: string
  message: string
}

interface ProductSearchState {
  status: SearchStatus
  products: Product[]
  total: number
  error: string | null
  retry: () => void
}

export function useProductSearch(query: string): ProductSearchState {
  // Trim first so " phone " and "phone" are the same query (and one debounce).
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS)
  const isActive = debouncedQuery.length >= MIN_QUERY_LENGTH

  // We store only the raw facts the network gives us. `status` is derived below,
  // so the effect never calls setState synchronously (no cascading renders).
  
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<SearchError | null>(null)
  // Bumped by retry() to re-run the effect for the same query (like refetch()).
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const controller = new AbortController()

    searchProducts(debouncedQuery, {
      signal: controller.signal,
      limit: RESULT_LIMIT,
    })
      .then((data) => {
        //alternatively we could but it would case cascading renders: 
        //setStatus('loading') but we are derving it at the end
        setResult({
          query: debouncedQuery,
          products: data.products,
          total: data.total,
        })
      })
      .catch((err: unknown) => {
        // A cancelled request rejects too — that's expected, not a real error.
        if (controller.signal.aborted) return
        setError({
          query: debouncedQuery,
          message: err instanceof Error ? err.message : 'Something went wrong',
        })
      })

    // Runs on the next query (or unmount): cancels the request still in flight,
    // which both frees the network and guarantees the latest query wins.
    return () => controller.abort()
  }, [debouncedQuery, isActive, retryCount])

  // Only data tagged with the *current* query counts — a second guard against
  // a stale response, on top of the abort.
  const activeResult = result?.query === debouncedQuery ? result : null
  const activeError = error?.query === debouncedQuery ? error : null

  let status: SearchStatus
  if (!isActive) status = 'idle'
  else if (activeError) status = 'error'
  else if (activeResult) status = 'success'
  else status = 'loading'

  const retry = useCallback(() => {
    // Clear the stale error so status derives back to 'loading' on re-run.
    setError(null)
    setRetryCount((count) => count + 1)
  }, [])

  return {
    status,
    // Keep the last results visible while a new query loads (no empty flash).
    products: isActive ? (result?.products ?? []) : [],
    total: isActive ? (result?.total ?? 0) : 0,
    error: activeError?.message ?? null,
    retry,
  }
}
