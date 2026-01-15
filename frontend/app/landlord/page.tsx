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
        const listings = response.data?.data || []
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
      message:
        'Объявление будет скрыто и перестанет отображаться пользователям. Вы всегда сможете создать копию на основе этого объявления.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await listingsAPI.delete(id)
          toast('Объявление скрыто (мягкое удаление)', 'success')
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
        newStatus === 'active'
          ? 'Объявление опубликовано'
          : 'Объявление скрыто от пользователей',
        'success'
      )
      loadData()
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast('Не удалось изменить видимость объявления', 'error')
    }
  }

  const handleDuplicateListing = async (id: string) => {
    try {
      const response = await listingsAPI.duplicate(id)
      toast('Копия объявления сохранена как черновик', 'success')
      // Можем сразу открыть редактирование копии или просто обновить список
      loadData()
    } catch (error) {
      console.error('Error duplicating listing:', error)
      toast('Не удалось создать копию объявления', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Кабинет арендодателя</h1>
              <p className="text-gray-600 mt-1">Управляйте объявлениями, бронированиями и статистикой</p>
            </div>
            <Link
              href="/landlord/listings/new-stepper"
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Создать объявление
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Объявления</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.listings}</p>
                </div>
                <Home className="w-10 h-10 text-primary opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Бронирования</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.bookings}</p>
                </div>
                <Calendar className="w-10 h-10 text-primary opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Доход</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.revenue.toLocaleString('ru-RU')} ₽</p>
                </div>
                <DollarSign className="w-10 h-10 text-primary opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Рейтинг</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
                  </p>
                </div>
                <Star className="w-10 h-10 text-primary opacity-20" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'listings'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Мои объявления
              {activeTab === 'listings' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'bookings'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Бронирования
              {activeTab === 'bookings' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  description="Создайте первое объявление, чтобы начать сдавать жильё. Это займёт всего несколько минут."
                  action={{
                    label: 'Создать объявление',
                    href: '/landlord/listings/new-stepper'
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <div key={listing.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                      {/* Image */}
                      <div className="relative w-full h-48 bg-gray-100">
                        {listing.images?.[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Home className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white transition-colors text-xs font-medium text-gray-800"
                            title="Просмотр объявления"
                          >
                            <span>Открыть</span>
                          </Link>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {listing.address || listing.city}
                        </p>
                        {/* Status */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              listing.status === 'active'
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : listing.status === 'draft'
                                ? 'bg-gray-50 text-gray-700 border border-gray-100'
                                : listing.status === 'hidden'
                                ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                : 'bg-gray-50 text-gray-500 border border-gray-100'
                            }`}
                          >
                            {listing.status === 'active' && 'Опубликовано'}
                            {listing.status === 'draft' && 'Черновик'}
                            {listing.status === 'hidden' && 'Скрыто'}
                            {listing.status === 'moderation' && 'На модерации'}
                            {listing.status === 'rejected' && 'Удалено'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div>
                            <div className="text-xl font-bold text-gray-900">
                              {listing.pricePerNight?.toLocaleString('ru-RU')} ₽
                            </div>
                            <div className="text-xs text-gray-500">за ночь</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleVisibility(listing)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-xs font-medium text-gray-700"
                              >
                                {listing.status === 'active' ? 'Скрыть' : 'Показать'}
                              </button>
                              <button
                                onClick={() => handleDuplicateListing(listing.id)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-xs font-medium text-gray-700"
                              >
                                Дублировать
                              </button>
                              <button
                                onClick={() => handleDeleteListing(listing.id)}
                                className="px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs font-medium text-red-700"
                              >
                                Удалить
                              </button>
                            </div>
                            <Link
                              href={`/landlord/listings/${listing.id}/edit`}
                              className="text-xs text-gray-500 hover:text-gray-700 underline decoration-dotted"
                            >
                              Редактировать детали
                            </Link>
                          </div>
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
                  description="Когда гости забронируют ваше жильё, запросы появятся здесь. Вы сможете подтвердить или отклонить их."
                />
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-xl border border-gray-100 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {booking.listing?.title || 'Объявление'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {new Date(booking.checkIn).toLocaleDateString('ru-RU')} — {new Date(booking.checkOut).toLocaleDateString('ru-RU')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Гостей: {booking.guests}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900 mb-1">
                            {booking.totalPrice?.toLocaleString('ru-RU')} ₽
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
