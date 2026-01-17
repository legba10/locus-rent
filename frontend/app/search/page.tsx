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
      const priceMin = searchParams.get('priceMin')
      const priceMax = searchParams.get('priceMax')
      const propertyType = searchParams.get('propertyType')
      const rating = searchParams.get('rating')
      const amenities = searchParams.get('amenities')
      
      if (city) params.city = city
      if (checkIn) params.checkIn = checkIn
      if (checkOut) params.checkOut = checkOut
      if (guests) params.guests = parseInt(guests)
      if (priceMin) params.minPrice = parseInt(priceMin)
      if (priceMax) params.maxPrice = parseInt(priceMax)
      if (propertyType && propertyType !== 'any') params.type = propertyType
      if (rating && rating !== 'any') params.minRating = parseFloat(rating)
      if (amenities) params.amenities = amenities.split(',')

      const response = await listingsAPI.getAll(params)
      // Backend возвращает массив напрямую или { data: [] }
      let listings: any[] = []
      if (Array.isArray(response.data)) {
        listings = response.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        listings = response.data.data
      }
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
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <Breadcrumbs 
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Поиск', href: '/search' },
              ...(city ? [{ label: city }] : [])
            ]} 
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                {city ? `Жильё в ${city}` : 'Поиск жилья'}
              </h1>
              {city && (
                <p className="text-sm sm:text-base text-gray-600">
                  {listings.length > 0 
                    ? `Найдено ${listings.length} ${listings.length === 1 ? 'вариант' : listings.length < 5 ? 'варианта' : 'вариантов'}`
                    : 'Варианты не найдены'
                  }
                </p>
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : viewMode === 'map' ? (
            <Suspense fallback={<div className="h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center bg-gray-50 rounded-xl sm:rounded-2xl">Загрузка карты...</div>}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
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
