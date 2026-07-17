import type { Product, ProductSearchResponse } from '../types/product'
import { useDebouncedValue } from './useDebouncedValue'
import { useFetch } from './useFetch'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

const SEARCH_URL = 'https://dummyjson.com/products/search'
const SELECT_FIELDS = 'title,price,thumbnail,brand,category'
const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 1
const RESULT_LIMIT = 8

function buildSearchUrl(query: string): string {
  const url = new URL(SEARCH_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(RESULT_LIMIT))
  url.searchParams.set('select', SELECT_FIELDS)
  return url.toString()
}

interface ProductSearchState {
  status: SearchStatus
  products: Product[]
  total: number
  error: string | null
  retry: () => void
}

export function useProductSearch(query: string): ProductSearchState {

  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS)
  const isActive = debouncedQuery.length >= MIN_QUERY_LENGTH

  const url = isActive ? buildSearchUrl(debouncedQuery) : null
  const { data, error, isLoading, refetch } =
    useFetch<ProductSearchResponse>(url)

  // Map the generic fetch state onto the product-search status machine.
  let status: SearchStatus
  if (!isActive) status = 'idle'
  else if (isLoading) status = 'loading'
  else if (error) status = 'error'
  else status = 'success'

  return {
    status,
    products: isActive ? (data?.products ?? []) : [],
    total: isActive ? (data?.total ?? 0) : 0,
    error,
    retry: refetch,
  }
}
