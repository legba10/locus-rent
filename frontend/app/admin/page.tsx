'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Shield, MessageSquare, FileText, Users, CheckCircle2, X, Loader2, UserPlus, Mail, Phone, Calendar, MapPin, Eye, Bed, Bath, Users as UsersIcon, Wrench } from 'lucide-react'
import { adminAPI, supportAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { toast } from '@/components/Toast'
import { sanitizeImages, normalizeImageSrc } from '@/lib/imageUtils'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'moderation' | 'support' | 'admins' | 'stats'>('moderation')
  const [listings, setListings] = useState<any[]>([])
  const [supportMessages, setSupportMessages] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [promoteEmail, setPromoteEmail] = useState('')
  const [promoteLoading, setPromoteLoading] = useState(false)
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'revision' | null>(null)
  const [revisionReason, setRevisionReason] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (user?.role !== 'admin' && user?.role !== 'ADMIN' && user?.email !== 'feodal.00@bk.ru') {
      toast('Доступ запрещён', 'error')
      router.push('/')
      return
    }
    
    loadData()
  }, [activeTab, isAuthenticated, user])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'moderation') {
        const response = await adminAPI.getListingsForModeration()
        setListings(Array.isArray(response.data) ? response.data : response.data?.data || [])
      } else if (activeTab === 'support') {
        const response = await supportAPI.getAll()
        setSupportMessages(Array.isArray(response.data) ? response.data : response.data?.data || [])
      } else if (activeTab === 'admins') {
        const response = await adminAPI.getAllUsers()
        setAllUsers(Array.isArray(response.data) ? response.data : response.data?.data || [])
      } else if (activeTab === 'stats') {
        const response = await adminAPI.getStats()
        setStats(response.data)
      }
    } catch (error: any) {
      console.error('Error loading admin data:', error)
      toast(error.userMessage || 'Ошибка загрузки данных', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleModerateListing = async (id: string, status: 'approved' | 'rejected' | 'needs_revision', reason?: string) => {
    try {
      // Для needs_revision причина обязательна
      if (status === 'needs_revision' && !reason?.trim()) {
        toast('Укажите причину доработки', 'warning')
        return
      }
      
      await adminAPI.moderateListing(id, status, reason?.trim())
      const messages = {
        approved: 'Объявление одобрено',
        rejected: 'Объявление отклонено',
        needs_revision: 'Объявление отправлено на доработку'
      }
      toast(messages[status], 'success')
      setSelectedListing(null)
      setModerationAction(null)
      setRevisionReason('')
      loadData()
    } catch (error: any) {
      toast(error.userMessage || error.response?.data?.message || 'Ошибка модерации', 'error')
    }
  }

  const openModerationModal = (listing: any, action: 'approve' | 'reject' | 'revision') => {
    setSelectedListing(listing)
    setModerationAction(action)
    setRevisionReason('')
  }

  const closeModerationModal = () => {
    setSelectedListing(null)
    setModerationAction(null)
    setRevisionReason('')
  }

  const handleUpdateSupportStatus = async (id: string, status: string) => {
    try {
      await supportAPI.update(id, { status })
      toast('Статус обновлён', 'success')
      loadData()
    } catch (error: any) {
      toast(error.userMessage || 'Ошибка обновления', 'error')
    }
  }

  const handlePromoteToAdmin = async () => {
    if (!promoteEmail.trim()) {
      toast('Введите email или телефон', 'warning')
      return
    }

    try {
      setPromoteLoading(true)
      await adminAPI.promoteToAdmin(promoteEmail.trim())
      toast('Пользователь назначен администратором', 'success')
      setPromoteEmail('')
      loadData()
    } catch (error: any) {
      toast(error.userMessage || 'Ошибка назначения администратора', 'error')
    } finally {
      setPromoteLoading(false)
    }
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'ADMIN' && user?.email !== 'feodal.00@bk.ru')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Header />
      
      <main className="container-custom py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="heading-1 mb-2">Админ-панель</h1>
          <p className="text-caption">Управление модерацией, поддержкой и администраторами</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-row gap-2 sm:gap-4 mb-6 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`tab whitespace-nowrap ${activeTab === 'moderation' ? 'tab-active' : 'tab-inactive'}`}
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
            Модерация
            {listings.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {listings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`tab whitespace-nowrap ${activeTab === 'support' ? 'tab-active' : 'tab-inactive'}`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
            Поддержка
            {supportMessages.filter(m => m.status === 'new').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {supportMessages.filter(m => m.status === 'new').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`tab whitespace-nowrap ${activeTab === 'admins' ? 'tab-active' : 'tab-inactive'}`}
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
            Администраторы
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`tab whitespace-nowrap ${activeTab === 'stats' ? 'tab-active' : 'tab-inactive'}`}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
            Статистика
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'moderation' && (
              <>
                <div className="card">
                  <h2 className="heading-2 mb-4">
                    Объявления на модерации ({listings.length})
                  </h2>
                  {listings.length === 0 ? (
                    <p className="text-caption text-center py-8">Нет объявлений на модерации</p>
                  ) : (
                    <div className="space-y-6">
                      {listings.map((listing) => {
                        const images = sanitizeImages(listing.images)
                        const mainImage = normalizeImageSrc(images[0])
                        return (
                          <div key={listing.id} className="card border-2 border-gray-200">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Фото */}
                              <div className="lg:col-span-1">
                                {images.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {images.slice(0, 4).map((img, idx) => (
                                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                          src={normalizeImageSrc(img)}
                                          alt={`${listing.title} - фото ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            ;(e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                                    <FileText className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Информация */}
                              <div className="lg:col-span-2 space-y-4">
                                <div>
                                  <h3 className="heading-3 mb-2">{listing.title || 'Без названия'}</h3>
                                  <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span className="text-sm">{listing.city || 'Город не указан'}</span>
                                      {listing.address && <span className="text-sm">• {listing.address}</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                      <span className="text-lg font-bold text-primary">{listing.pricePerNight || 0} ₽</span>
                                      <span className="text-sm">/ночь</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Описание */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-1">Описание</h4>
                                  <p className="text-sm text-gray-700 line-clamp-3">{listing.description || 'Описание отсутствует'}</p>
                                </div>

                                {/* Характеристики */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {listing.maxGuests && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <UsersIcon className="w-4 h-4 text-primary" />
                                      <span>До {listing.maxGuests} гостей</span>
                                    </div>
                                  )}
                                  {listing.bedrooms > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Bed className="w-4 h-4 text-primary" />
                                      <span>{listing.bedrooms} спален</span>
                                    </div>
                                  )}
                                  {listing.beds > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Bed className="w-4 h-4 text-primary" />
                                      <span>{listing.beds} кроватей</span>
                                    </div>
                                  )}
                                  {listing.bathrooms > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Bath className="w-4 h-4 text-primary" />
                                      <span>{listing.bathrooms} ванных</span>
                                    </div>
                                  )}
                                </div>

                                {/* Владелец и дата */}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-200">
                                  <div>
                                    <span className="font-medium">Владелец:</span>{' '}
                                    {listing.owner?.email || listing.ownerId || 'Не указан'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Создано:</span>{' '}
                                    {new Date(listing.createdAt).toLocaleDateString('ru-RU', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  {listing.revisionReason && (
                                    <div className="w-full">
                                      <span className="font-medium text-orange-600">Причина доработки:</span>{' '}
                                      <span className="text-orange-700">{listing.revisionReason}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Кнопки модерации */}
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <button
                                    onClick={() => handleModerateListing(listing.id, 'approved')}
                                    className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Одобрить
                                  </button>
                                  <button
                                    onClick={() => openModerationModal(listing, 'reject')}
                                    className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    <X className="w-4 h-4" />
                                    Отклонить
                                  </button>
                                  <button
                                    onClick={() => openModerationModal(listing, 'revision')}
                                    className="btn btn-sm bg-orange-600 hover:bg-orange-700 text-white"
                                  >
                                    <Wrench className="w-4 h-4" />
                                    На доработку
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Модальное окно для причины отклонения/доработки */}
                {selectedListing && moderationAction && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                      <h3 className="heading-2 mb-4">
                        {moderationAction === 'reject' ? 'Отклонить объявление' : 'Отправить на доработку'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Объявление: <strong>{selectedListing.title}</strong>
                      </p>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {moderationAction === 'reject' ? 'Причина отклонения' : 'Причина доработки'} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={revisionReason}
                          onChange={(e) => setRevisionReason(e.target.value)}
                          placeholder={moderationAction === 'reject' ? 'Укажите причину отклонения объявления...' : 'Укажите, что нужно исправить в объявлении...'}
                          className="input w-full h-32 resize-none"
                          required
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={closeModerationModal}
                          className="btn btn-secondary"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={() => {
                            if (!revisionReason.trim()) {
                              toast('Укажите причину', 'warning')
                              return
                            }
                            handleModerateListing(
                              selectedListing.id,
                              moderationAction === 'reject' ? 'rejected' : 'needs_revision',
                              revisionReason.trim()
                            )
                          }}
                          className={`btn ${moderationAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
                        >
                          {moderationAction === 'reject' ? 'Отклонить' : 'Отправить на доработку'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'support' && (
              <div className="card">
                <h2 className="heading-2 mb-4">
                  Сообщения поддержки ({supportMessages.length})
                </h2>
                {supportMessages.length === 0 ? (
                  <p className="text-caption text-center py-8">Нет сообщений</p>
                ) : (
                  <div className="space-y-4">
                    {supportMessages.map((message) => (
                      <div key={message.id} className="card">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">{message.name}</span>
                              <span className="text-caption">{message.phone}</span>
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                message.status === 'new'
                                  ? 'bg-blue-100 text-blue-700'
                                  : message.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {message.status === 'new' ? 'Новое' :
                                 message.status === 'in_progress' ? 'В работе' : 'Решено'}
                              </span>
                            </div>
                            {message.description && (
                              <p className="text-caption mb-2">
                                <strong>Описание:</strong> {message.description}
                              </p>
                            )}
                            <p className="text-body mb-2">{message.message}</p>
                            <p className="text-caption">
                              {new Date(message.createdAt).toLocaleString('ru-RU')}
                            </p>
                          </div>
                          <div className="sm:w-48 w-full">
                            <select
                              value={message.status}
                              onChange={(e) => handleUpdateSupportStatus(message.id, e.target.value)}
                              className="input w-full"
                            >
                              <option value="new">Новое</option>
                              <option value="in_progress">В работе</option>
                              <option value="resolved">Решено</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'admins' && (
              <div className="space-y-6">
                {/* Promote to Admin */}
                <div className="card">
                  <h2 className="heading-2 mb-4">Назначить администратора</h2>
                  <p className="text-caption mb-4">
                    Введите email или телефон существующего пользователя для назначения администратором
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={promoteEmail}
                      onChange={(e) => setPromoteEmail(e.target.value)}
                      placeholder="email@example.com или +7 (999) 123-45-67"
                      className="input flex-1"
                    />
                    <button
                      onClick={handlePromoteToAdmin}
                      disabled={promoteLoading || !promoteEmail.trim()}
                      className="btn btn-primary"
                    >
                      {promoteLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Назначение...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Назначить
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Admins List */}
                <div className="card">
                  <h2 className="heading-2 mb-4">Список администраторов</h2>
                  {allUsers.filter(u => u.role === 'admin').length === 0 ? (
                    <p className="text-caption text-center py-8">Нет администраторов</p>
                  ) : (
                    <div className="space-y-3">
                      {allUsers
                        .filter(u => u.role === 'admin')
                        .map((admin) => (
                          <div key={admin.id} className="card">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Shield className="w-4 h-4 text-primary" />
                                  <span className="font-semibold text-gray-900">
                                    {admin.firstName} {admin.lastName}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-caption">
                                  {admin.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {admin.email}
                                    </span>
                                  )}
                                  {admin.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {admin.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                                Администратор
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="space-y-6">
                {/* Основная статистика */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-gray-900">Пользователи</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.users?.total || 0}</p>
                    <p className="text-caption">Активных: {stats.users?.active || 0}</p>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-gray-900">Объявления</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.listings?.total || 0}</p>
                    <p className="text-caption">
                      Опубликовано: {stats.listings?.published || 0} | На модерации: {stats.listings?.moderation || 0}
                    </p>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-gray-900">Бронирования</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.bookings?.total || 0}</p>
                    <p className="text-caption">
                      Подтверждено: {stats.bookings?.confirmed || 0}
                    </p>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-gray-900">Поддержка</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{supportMessages.length}</p>
                    <p className="text-caption">
                      Новых: {supportMessages.filter(m => m.status === 'new').length}
                    </p>
                  </div>
                </div>

                {/* Новые пользователи */}
                <div className="card">
                  <h2 className="heading-2 mb-4">Новые пользователи</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-caption mb-1">За день</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.users?.newToday || 0}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-caption mb-1">За неделю</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.users?.newThisWeek || 0}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-caption mb-1">За месяц</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.users?.newThisMonth || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Бронирования - детали */}
                <div className="card">
                  <h2 className="heading-2 mb-4">Бронирования</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-caption mb-1">Общая сумма</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.bookings?.totalAmount?.toLocaleString('ru-RU') || 0} ₽
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-caption mb-1">Средний чек</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.bookings?.averageCheck?.toLocaleString('ru-RU') || 0} ₽
                      </p>
                    </div>
                  </div>
                </div>

                {/* Юнит-экономика */}
                <div className="card">
                  <h2 className="heading-2 mb-4">Юнит-экономика</h2>
                  <p className="text-caption mb-4">Подготовка под интеграцию с ЮKassa</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-caption mb-1">Доход платформы</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.economics?.platformRevenue?.toLocaleString('ru-RU') || 0} ₽
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-caption mb-1">Комиссия</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.economics?.commission?.toLocaleString('ru-RU') || 0} ₽
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-caption mb-1">Ставка комиссии</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.economics?.commissionRate ? (stats.economics.commissionRate * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-caption mb-1">Средний чек</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.economics?.averageCheck?.toLocaleString('ru-RU') || 0} ₽
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
