'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import { listingsAPI, bookingsAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { 
  MapPin, Star, Users, Bed, Bath, Calendar, 
  Wifi, Car, UtensilsCrossed, Wind, Tv, 
  Home, ArrowLeft, Heart, Share2, Loader2 
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from '@/components/Toast'
import Breadcrumbs from '@/components/Breadcrumbs'
import Tooltip from '@/components/Tooltip'

// Lazy load MapView
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadListing()
  }, [params.id])

  const loadListing = async () => {
    try {
      setLoading(true)
      const response = await listingsAPI.getOne(params.id as string)
      setListing(response.data?.data || null)
    } catch (error) {
      console.error('Error loading listing:', error)
      setError('Объявление не найдено')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      setError('Выберите даты заезда и выезда')
      return
    }

    setBookingLoading(true)
    setError('')

    try {
      await bookingsAPI.create({
        listingId: listing.id,
        checkIn: bookingDates.checkIn,
        checkOut: bookingDates.checkOut,
        guests: bookingDates.guests,
      })
      toast('Бронирование успешно создано!', 'success')
      router.push('/profile')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка создания бронирования'
      setError(errorMessage)
      toast(errorMessage, 'error')
    } finally {
      setBookingLoading(false)
    }
  }

  const amenitiesIcons: Record<string, any> = {
    wifi: Wifi,
    parking: Car,
    kitchen: UtensilsCrossed,
    airConditioning: Wind,
    tv: Tv,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/" className="text-primary hover:text-primary-dark">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Гарантируем, что images всегда массив
  const images = Array.isArray(listing.images) ? listing.images : (listing.images ? [listing.images] : [])
  const mainImage = images[0] || listing.imageUrl
  const price = listing.pricePerNight || listing.price || 0

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumbs
            items={[
              { label: 'Поиск', href: '/' },
              { label: listing?.title || 'Объявление' }
            ]}
          />
        </div>

        {/* Image Gallery */}
        <div className="container mx-auto px-4 py-6">
          <div className="relative w-full h-[500px] rounded-2xl overflow-hidden bg-gray-100">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={listing.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Home className="w-24 h-24" />
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {listing.title}
                  </h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    {listing.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{listing.rating.toFixed(1)}</span>
                        {listing.reviewsCount && (
                          <span className="text-gray-600">
                            ({listing.reviewsCount} {listing.reviewsCount === 1 ? 'отзыв' : 'отзывов'})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-5 h-5" />
                      <span>{listing.address || listing.city}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {listing.description && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Описание</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {listing.description}
                    </p>
                  </div>
                )}

                {/* Features */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Удобства</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {listing.maxGuests && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-5 h-5 text-gray-400" />
                        <span>До {listing.maxGuests} гостей</span>
                      </div>
                    )}
                    {listing.bedrooms && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Bed className="w-5 h-5 text-gray-400" />
                        <span>{listing.bedrooms} {listing.bedrooms === 1 ? 'спальня' : 'спальни'}</span>
                      </div>
                    )}
                    {listing.beds && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Bed className="w-5 h-5 text-gray-400" />
                        <span>{listing.beds} {listing.beds === 1 ? 'кровать' : 'кроватей'}</span>
                      </div>
                    )}
                    {listing.bathrooms && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Bath className="w-5 h-5 text-gray-400" />
                        <span>{listing.bathrooms} {listing.bathrooms === 1 ? 'ванная' : 'ванных'}</span>
                      </div>
                    )}
                    {listing.amenities?.map((amenity: string) => {
                      const Icon = amenitiesIcons[amenity]
                      if (!Icon) return null
                      return (
                        <div key={amenity} className="flex items-center gap-2 text-gray-700">
                          <Icon className="w-5 h-5 text-gray-400" />
                          <span className="capitalize">{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Map */}
                {listing.latitude && listing.longitude && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Местоположение</h2>
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <MapView listings={[listing]} />
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-3xl font-bold text-gray-900">
                        {price.toLocaleString('ru-RU')} ₽
                      </div>
                      <Tooltip content="Цена указана за одну ночь проживания" icon />
                    </div>
                    <div className="text-gray-600">за ночь</div>
                  </div>

                  {/* Booking Form */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Заезд
                      </label>
                      <input
                        type="date"
                        value={bookingDates.checkIn}
                        onChange={(e) => setBookingDates({ ...bookingDates, checkIn: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Выезд
                      </label>
                      <input
                        type="date"
                        value={bookingDates.checkOut}
                        onChange={(e) => setBookingDates({ ...bookingDates, checkOut: e.target.value })}
                        min={bookingDates.checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Гостей
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={listing.maxGuests || 10}
                        value={bookingDates.guests}
                        onChange={(e) => setBookingDates({ ...bookingDates, guests: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="w-full bg-primary text-white py-3.5 rounded-lg hover:bg-primary-dark transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Бронирование...
                      </>
                    ) : (
                      'Забронировать'
                    )}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-sm text-gray-600 text-center mt-4">
                      <Link href="/login" className="text-primary hover:text-primary-dark">
                        Войдите
                      </Link>
                      {' '}для бронирования
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
