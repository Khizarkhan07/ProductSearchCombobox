/**
 * A single product as returned by the DummyJSON search endpoint.
 * Only typing what we select from the api end point so we dont have any dead weight
 */
export interface Product {
  id: number
  title: string
  price: number
  thumbnail: string
  /** Not every product has a brand (e.g. groceries), so this is optional. */
  brand?: string
  category: string
}

/**
 * The full response envelope from `/products/search`.
 *
 * `total` is the count of ALL matches on the server, which can be far larger
 * than `products.length` (we cap the page with `limit`). That gap is what
 * powers the "showing N of total" footer in the dropdown.
 */
export interface ProductSearchResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}
