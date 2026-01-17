'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Shield, MessageSquare, FileText, Users, CheckCircle2, X, Loader2, UserPlus, Mail, Phone } from 'lucide-react'
import { adminAPI, supportAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { toast } from '@/components/Toast'

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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (user?.role !== 'admin') {
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

  const handleModerateListing = async (id: string, status: 'active' | 'rejected') => {
    try {
      await adminAPI.moderateListing(id, status)
      toast(status === 'active' ? 'Объявление одобрено' : 'Объявление отклонено', 'success')
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

  if (!isAuthenticated || user?.role !== 'admin') {
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
              <div className="card">
                <h2 className="heading-2 mb-4">
                  Объявления на модерации ({listings.length})
                </h2>
                {listings.length === 0 ? (
                  <p className="text-caption text-center py-8">Нет объявлений на модерации</p>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing) => (
                      <div key={listing.id} className="card">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="heading-3 mb-2">{listing.title}</h3>
                            <p className="text-caption mb-2 line-clamp-2">{listing.description}</p>
                            <div className="flex flex-wrap gap-2 text-caption">
                              <span>{listing.city}</span>
                              <span>•</span>
                              <span>{listing.pricePerNight} ₽/ночь</span>
                              <span>•</span>
                              <span>{new Date(listing.createdAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 sm:flex-col sm:w-auto w-full">
                            <button
                              onClick={() => handleModerateListing(listing.id, 'active')}
                              className="btn btn-sm bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Одобрить
                            </button>
                            <button
                              onClick={() => handleModerateListing(listing.id, 'rejected')}
                              className="btn btn-sm bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
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
                    Активных: {stats.listings?.active || 0} | На модерации: {stats.listings?.moderation || 0}
                  </p>
                </div>
                <div className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
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
            )}
          </>
        )}
      </main>
    </div>
  )
}
