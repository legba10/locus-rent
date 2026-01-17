'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Shield, MessageSquare, FileText, Users, CheckCircle2, X, Clock, Loader2, Calendar } from 'lucide-react'
import { adminAPI, supportAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { toast } from '@/components/Toast'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'moderation' | 'support' | 'stats'>('moderation')
  const [listings, setListings] = useState<any[]>([])
  const [supportMessages, setSupportMessages] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    // Проверка прав администратора
    if (user?.role !== 'admin') {
      toast('У вас нет прав доступа к админ-панели', 'error')
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
        setListings(response.data || [])
      } else if (activeTab === 'support') {
        const response = await supportAPI.getAll()
        setSupportMessages(response.data || [])
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

  const handleModerateListing = async (id: string, status: 'active' | 'rejected') => {
    try {
      await adminAPI.moderateListing(id, status)
      toast(
        status === 'active' ? 'Объявление одобрено' : 'Объявление отклонено',
        'success'
      )
      loadData()
    } catch (error: any) {
      toast(error.userMessage || 'Ошибка модерации', 'error')
    }
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

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Админ-панель</h1>
          <p className="text-sm sm:text-base text-gray-600">Управление модерацией и поддержкой</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
              activeTab === 'moderation'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Модерация
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
              activeTab === 'support'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Поддержка
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base whitespace-nowrap transition-colors ${
              activeTab === 'stats'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                    Объявления на модерации ({listings.length})
                  </h2>
                  {listings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Нет объявлений на модерации</p>
                  ) : (
                    <div className="space-y-4">
                      {listings.map((listing) => (
                        <div
                          key={listing.id}
                          className="border border-gray-200 rounded-lg p-4 sm:p-6"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-2">{listing.title}</h3>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {listing.description}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500">
                                <span>{listing.city}</span>
                                <span>•</span>
                                <span>{listing.pricePerNight} ₽/ночь</span>
                                <span>•</span>
                                <span>Создано: {new Date(listing.createdAt).toLocaleDateString('ru-RU')}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 sm:flex-col">
                              <button
                                onClick={() => handleModerateListing(listing.id, 'active')}
                                className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Одобрить
                              </button>
                              <button
                                onClick={() => handleModerateListing(listing.id, 'rejected')}
                                className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Отклонить
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                    Сообщения поддержки ({supportMessages.length})
                  </h2>
                  {supportMessages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Нет сообщений</p>
                  ) : (
                    <div className="space-y-4">
                      {supportMessages.map((message) => (
                        <div
                          key={message.id}
                          className="border border-gray-200 rounded-lg p-4 sm:p-6"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-gray-900">{message.name}</span>
                                <span className="text-sm text-gray-500">{message.phone}</span>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    message.status === 'new'
                                      ? 'bg-blue-100 text-blue-700'
                                      : message.status === 'in_progress'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {message.status === 'new'
                                    ? 'Новое'
                                    : message.status === 'in_progress'
                                    ? 'В работе'
                                    : 'Решено'}
                                </span>
                              </div>
                              {message.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>Описание:</strong> {message.description}
                                </p>
                              )}
                              <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString('ru-RU')}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:w-48">
                              <select
                                value={message.status}
                                onChange={(e) =>
                                  handleUpdateSupportStatus(message.id, e.target.value)
                                }
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-gray-900">Пользователи</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.users?.total || 0}</p>
                  <p className="text-sm text-gray-600">Активных: {stats.users?.active || 0}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-gray-900">Объявления</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.listings?.total || 0}</p>
                  <p className="text-sm text-gray-600">
                    Активных: {stats.listings?.active || 0} | На модерации: {stats.listings?.moderation || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-gray-900">Бронирования</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.bookings?.total || 0}</p>
                  <p className="text-sm text-gray-600">
                    Подтверждено: {stats.bookings?.confirmed || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-gray-900">Поддержка</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{supportMessages.length}</p>
                  <p className="text-sm text-gray-600">
                    Новых: {supportMessages.filter((m) => m.status === 'new').length}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
