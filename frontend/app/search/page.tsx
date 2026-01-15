'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import ListingCard from '@/components/ListingCard'
import { ListingCardSkeleton } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import { Home as HomeIcon } from 'lucide-react'
import { listingsAPI } from '@/lib/api'
import { toast } from '@/components/Toast'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Lazy load MapView
const MapView = lazy(() => import('@/components/MapView'))

function SearchContent() {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadListings()
  }, [searchParams])

  const loadListings = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      const city = searchParams.get('city')
      const checkIn = searchParams.get('checkIn')
      const checkOut = searchParams.get('checkOut')
      const guests = searchParams.get('guests')
      
      if (city) params.city = city
      if (checkIn) params.checkIn = checkIn
      if (checkOut) params.checkOut = checkOut
      if (guests) params.guests = parseInt(guests)

      const response = await listingsAPI.getAll(params)
      const listings = response.data?.data || []
      setListings(listings)
      
      if (listings.length === 0) {
        toast('По вашему запросу ничего не найдено', 'info')
      }
    } catch (error) {
      console.error('Error loading listings:', error)
      toast('Ошибка загрузки объявлений', 'error')
    } finally {
      setLoading(false)
    }
  }

  const city = searchParams.get('city') || ''

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs 
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Поиск', href: '/search' },
              ...(city ? [{ label: city }] : [])
            ]} 
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {city ? `Жильё в ${city}` : 'Поиск жилья'}
              </h1>
              {city && (
                <p className="text-gray-600">
                  {listings.length > 0 
                    ? `Найдено ${listings.length} ${listings.length === 1 ? 'вариант' : listings.length < 5 ? 'варианта' : 'вариантов'}`
                    : 'Варианты не найдены'
                  }
                </p>
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Список
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Карта
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : viewMode === 'map' ? (
            <Suspense fallback={<div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl">Загрузка карты...</div>}>
              <MapView listings={listings} />
            </Suspense>
          ) : (
            <>
              {listings.length === 0 ? (
                <EmptyState
                  icon={HomeIcon}
                  title="Ничего не найдено"
                  description="Попробуйте изменить параметры поиска или использовать умный подбор"
                  action={{
                    label: 'Умный подбор',
                    href: '/smart-search'
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {listings.map((listing: any) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
