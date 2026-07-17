import { SearchBar } from './components/SearchBar'

function App() {

  return (
    <main className="min-h-svh bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          Product search
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Start typing to search the catalogue.
        </p>

        <SearchBar onProductSelect={(product) => console.log(product.title)} />

      </div>
    </main>
  )
}

export default App
