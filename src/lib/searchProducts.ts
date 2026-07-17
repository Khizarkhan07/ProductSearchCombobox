import type { ProductSearchResponse } from '../types/product'

const SEARCH_URL = 'https://dummyjson.com/products/search'

/** Trims each row's payload to only what the UI renders. */
const SELECT_FIELDS = 'title,price,thumbnail,brand,category'

interface SearchOptions {
  /** Passed straight to fetch so an in-flight request can be cancelled. */
  signal?: AbortSignal
  /** Cap on how many rows the server returns — keeps the dropdown small for a better UX*/
  limit?: number
}

export async function searchProducts(
  query: string,
  { signal, limit = 8 }: SearchOptions = {},
): Promise<ProductSearchResponse> {

  const url = new URL(SEARCH_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('select', SELECT_FIELDS)

  const response = await fetch(url, { signal })

  // fetch only rejects on network failure, not on 4xx/5xx
  if (!response.ok) {
    throw new Error(`Search request failed (${response.status})`)
  }

  return (await response.json()) as ProductSearchResponse
}
