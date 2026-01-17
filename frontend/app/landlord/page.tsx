'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Home, Plus, Calendar, DollarSign, Star, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { listingsAPI, bookingsAPI } from '@/lib/api'
import ListingCard from '@/components/ListingCard'
import { useAuthStore } from '@/lib/store'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { toast } from '@/components/Toast'
import EmptyState from '@/components/EmptyState'
import { ListingCardSkeleton } from '@/components/Skeleton'

export default function LandlordPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState('listings')
  const [listings, setListings] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    listings: 0,
    bookings: 0,
    revenue: 0,
    rating: 0,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadData()
  }, [activeTab, isAuthenticated])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'listings') {
        const response = await listingsAPI.getMy()
        // Backend может вернуть массив напрямую или { data: [] }
        let listings: any[] = []
        if (Array.isArray(response.data)) {
          listings = response.data
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          listings = response.data.data
        }
        setListings(listings)
        setStats(prev => ({ ...prev, listings: listings.length }))
      } else if (activeTab === 'bookings') {
        const response = await bookingsAPI.getAll()
        const bookings = response.data?.data || []
        setBookings(bookings)
        setStats(prev => ({ ...prev, bookings: bookings.length }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmDialog = useConfirmDialog()

  const handleDeleteListing = async (id: string) => {
    confirmDialog.show({
      title: 'Удалить объявление?',
      message: 'Объявление будет скрыто и перестанет отображаться пользователям.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await listingsAPI.delete(id)
          toast('Объявление скрыто', 'success')
          loadData()
        } catch (error) {
          console.error('Error deleting listing:', error)
          toast('Ошибка скрытия объявления', 'error')
        }
      },
    })
  }

  const handleToggleVisibility = async (listing: any) => {
    const newStatus = listing.status === 'active' ? 'hidden' : 'active'
    try {
      await listingsAPI.update(listing.id, { status: newStatus })
      toast(
        newStatus === 'active' ? 'Объявление опубликовано' : 'Объявление скрыто',
        'success'
      )
      loadData()
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast('Не удалось изменить видимость', 'error')
    }
  }

  const handleDuplicateListing = async (id: string) => {
    try {
      await listingsAPI.duplicate(id)
      toast('Копия объявления создана', 'success')
      loadData()
    } catch (error) {
      console.error('Error duplicating listing:', error)
      toast('Не удалось создать копию', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Header />
      
      <main className="container-custom py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="heading-1 mb-2">Кабинет арендодателя</h1>
              <p className="text-caption">Управляйте объявлениями и бронированиями</p>
            </div>
            <Link href="/landlord/listings/new-stepper" className="btn btn-primary w-full sm:w-auto">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Создать объявление</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-caption mb-1">Объявления</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.listings}</p>
                </div>
                <Home className="w-8 h-8 sm:w-10 sm:h-10 text-primary opacity-20 flex-shrink-0" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-caption mb-1">Бронирования</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.bookings}</p>
                </div>
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-primary opacity-20 flex-shrink-0" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-caption mb-1">Доход</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {stats.revenue.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-primary opacity-20 flex-shrink-0" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-caption mb-1">Рейтинг</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
                  </p>
                </div>
                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-primary opacity-20 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Tabs - Horizontal on all screens */}
          <div className="flex flex-row gap-2 sm:gap-4 mb-6 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setActiveTab('listings')}
              className={`tab whitespace-nowrap ${activeTab === 'listings' ? 'tab-active' : 'tab-inactive'}`}
            >
              Мои объявления
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`tab whitespace-nowrap ${activeTab === 'bookings' ? 'tab-active' : 'tab-inactive'}`}
            >
              Бронирования
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid-responsive">
              {[...Array(3)].map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : activeTab === 'listings' ? (
            <div>
              {listings.length === 0 ? (
                <EmptyState
                  icon={Home}
                  title="Пока нет объявлений"
                  description="Создайте первое объявление, чтобы начать сдавать жильё."
                  action={{
                    label: 'Создать объявление',
                    href: '/landlord/listings/new-stepper'
                  }}
                />
              ) : (
                <div className="grid-responsive">
                  {listings.map((listing) => (
                    <div key={listing.id} className="card card-hover overflow-hidden">
                      {/* Image */}
                      <div className="relative w-full h-48 bg-gray-100 -m-4 sm:-m-6 mb-4 sm:mb-6">
                        {listing.images?.[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Home className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="btn btn-sm bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800"
                          >
                            Открыть
                          </Link>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div>
                        <h3 className="heading-3 mb-2 line-clamp-2">{listing.title}</h3>
                        <p className="text-caption mb-3 line-clamp-1">
                          {listing.address || listing.city}
                        </p>
                        
                        {/* Status */}
                        <div className="mb-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              listing.status === 'active'
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : listing.status === 'draft'
                                ? 'bg-gray-50 text-gray-700 border border-gray-100'
                                : listing.status === 'hidden'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                : listing.status === 'moderation'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-gray-50 text-gray-500 border border-gray-100'
                            }`}
                          >
                            {listing.status === 'active' && 'Опубликовано'}
                            {listing.status === 'draft' && 'Черновик'}
                            {listing.status === 'hidden' && 'Скрыто'}
                            {listing.status === 'moderation' && 'На модерации'}
                            {listing.status === 'rejected' && 'Отклонено'}
                          </span>
                        </div>
                        
                        {/* Price and Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <div className="text-xl font-bold text-gray-900">
                              {listing.pricePerNight?.toLocaleString('ru-RU')} ₽
                            </div>
                            <div className="text-caption">за ночь</div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            onClick={() => handleToggleVisibility(listing)}
                            className="btn btn-sm btn-secondary flex-1 min-w-0"
                          >
                            {listing.status === 'active' ? 'Скрыть' : 'Показать'}
                          </button>
                          <button
                            onClick={() => handleDuplicateListing(listing.id)}
                            className="btn btn-sm btn-secondary flex-1 min-w-0"
                          >
                            Копировать
                          </button>
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="btn btn-sm bg-red-50 hover:bg-red-100 text-red-700 flex-1 min-w-0"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {bookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Пока нет бронирований"
                  description="Когда гости забронируют ваше жильё, запросы появятся здесь."
                />
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="card">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="heading-3 mb-2">
                            {booking.listing?.title || 'Объявление'}
                          </h3>
                          <div className="space-y-1 text-caption">
                            <p>
                              {new Date(booking.checkIn).toLocaleDateString('ru-RU')} — {new Date(booking.checkOut).toLocaleDateString('ru-RU')}
                            </p>
                            <p>Гостей: {booking.guests}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                          <div className="text-xl font-bold text-gray-900">
                            {booking.totalPrice?.toLocaleString('ru-RU')} ₽
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status === 'confirmed' ? 'Подтверждено' :
                             booking.status === 'pending' ? 'Ожидает' :
                             'Отменено'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
