'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import SearchBar from './SearchBar'
import MapView from './MapView'
import ListingCard from './ListingCard'
import Header from './Header'

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [listings, setListings] = useState([])

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Найдите идеальное жильё
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            LOCUS поможет вам найти лучший вариант для отдыха или работы
          </p>
          
          {/* Умный поиск */}
          <div className="mb-6">
            <Link
              href="/smart-search"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              <Sparkles className="w-5 h-5" />
              Умный подбор жилья
            </Link>
          </div>
          
          <SearchBar />
        </section>

        {/* View Toggle */}
        <div className="flex justify-end mb-6">
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-soft">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-bg'
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'map'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-bg'
              }`}
            >
              Карта
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'map' ? (
          <MapView listings={listings} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-text-secondary text-lg">
                  Начните поиск, чтобы увидеть доступные варианты
                </p>
              </div>
            ) : (
              listings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
