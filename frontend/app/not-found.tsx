import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Страница не найдена
          </h2>
          <p className="text-gray-600 mb-8">
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Home className="w-5 h-5" />
              На главную
            </Link>
            <Link
              href="/smart-search"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Search className="w-5 h-5" />
              Найти жильё
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
