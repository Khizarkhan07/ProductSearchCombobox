import type { Product } from '../types/product'

interface ResultItemProps {
  product: Product
  /** DOM id so the input's aria-activedescendant can reference the active row. */
  id: string
  isActive: boolean
  onSelect: (product: Product) => void
  onHover: () => void
}

// Built once at module load, not per render — formatting is not free.
const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function ResultItem({
  product,
  id,
  isActive,
  onSelect,
  onHover,
}: ResultItemProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      // mousemove (not mouseenter) so a keyboard-driven scroll moving a row under
      // a stationary cursor can't hijack the active option. The guard avoids
      // firing setState on every pixel of real movement.
      onMouseMove={() => {
        if (!isActive) onHover()
      }}
      // mousedown + preventDefault (not onClick) keeps focus in the input, so
      // the dropdown doesn't blur-close before the selection registers.
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect(product)
      }}
      className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
        isActive ? 'bg-indigo-50 dark:bg-indigo-950/50' : ''
      }`}
    >
      <img
        src={product.thumbnail}
        alt=""
        loading="lazy"
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-md bg-white object-contain dark:bg-gray-800"
        // onError={} for 404 images
      />

      {/* min-w-0 lets the truncate below actually clip inside the flex row. */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {product.title}
        </p>
        <p className="truncate text-xs text-gray-500 capitalize dark:text-gray-400">
          {product.brand ?? product.category}
        </p>
      </div>

      <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {priceFormatter.format(product.price)}
      </span>
    </li>
  )
}
