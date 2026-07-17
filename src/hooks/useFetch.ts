import { useCallback, useEffect, useState } from 'react'

interface UseFetchResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refetch: () => void
}

/**
 * Generic JSON GET hook. Fetches `url`, aborts the in-flight request whenever
 * `url` changes, and derives `isLoading` without any synchronous setState in the
 * effect (no cascading renders). Pass `url = null` to stay idle — no request.
 *
 * Responses are tagged with the url they came from, so a slow stale response can
 * never overwrite a newer one — a second guard on top of the abort.
 */
export function useFetch<T>(url: string | null): UseFetchResult<T> {
  const [result, setResult] = useState<{ url: string; data: T } | null>(null)
  const [failure, setFailure] = useState<{ url: string; message: string } | null>(
    null,
  )
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (url === null) return

    const controller = new AbortController()

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        // fetch only rejects on network failure, not on 4xx/5xx.
        if (!response.ok) throw new Error(`Request failed (${response.status})`)
        return (await response.json()) as T
      })
      .then((data) => setResult({ url, data }))
      .catch((err: unknown) => {
        // A cancelled request rejects too — that's expected, not a real error.
        if (controller.signal.aborted) return
        setFailure({
          url,
          message: err instanceof Error ? err.message : 'Something went wrong',
        })
      })

    return () => controller.abort()
  }, [url, reloadKey])

  const refetch = useCallback(() => {
    setFailure(null)
    setReloadKey((key) => key + 1)
  }, [])

  // Only data/error tagged with the *current* url counts.
  const hasCurrentData = result?.url === url
  const activeError = failure?.url === url ? failure : null

  return {
    data: url === null ? null : (result?.data ?? null),
    error: activeError?.message ?? null,
    isLoading: url !== null && !hasCurrentData && activeError === null,
    refetch,
  }
}
