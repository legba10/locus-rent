'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { User as UserIcon, Calendar, Heart, MessageSquare, Bell, Settings, History, Sparkles } from 'lucide-react'
import { usersAPI, recommendationAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { User } from '@/lib/types/user'

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, initialized } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState<User | null>(null)
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [preferences, setPreferences] = useState<any | null>(null)

  // Защита маршрута: редирект неавторизованных пользователей
  useEffect(() => {
    if (!initialized) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadUserData()
    if (activeTab === 'history') {
      loadSearchHistory()
    }
    if (activeTab === 'preferences') {
      loadPreferences()
    }
  }, [activeTab, initialized, isAuthenticated])

  const loadUserData = async () => {
    try {
      const response = await usersAPI.getMe()
      setUser(response.data ?? null)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadSearchHistory = async () => {
    try {
      const response = await recommendationAPI.getSearchHistory()
      setSearchHistory(response.data?.data || [])
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }

  const loadPreferences = async () => {
    try {
      const response = await recommendationAPI.getPreferences()
      setPreferences(response.data?.data || null)
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  // Пока идёт инициализация авторизации — показываем простой плейсхолдер
  if (!initialized) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <p className="text-center text-text-secondary">Загрузка личного кабинета...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <Header />
      
      <main className="container-custom py-4 sm:py-6 md:py-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-6 sm:mb-8">
            <h1 className="heading-1 mb-2">Личный кабинет</h1>
            <p className="text-caption">Управляйте профилем, бронированиями и настройками</p>
          </div>

          {/* Tabs - Horizontal scroll on mobile */}
          <div className="flex flex-row gap-2 sm:gap-4 mb-6 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`tab whitespace-nowrap ${activeTab === 'profile' ? 'tab-active' : 'tab-inactive'}`}
            >
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
              Профиль
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`tab whitespace-nowrap ${activeTab === 'bookings' ? 'tab-active' : 'tab-inactive'}`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
              Бронирования
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`tab whitespace-nowrap ${activeTab === 'favorites' ? 'tab-active' : 'tab-inactive'}`}
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
              Избранное
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`tab whitespace-nowrap ${activeTab === 'history' ? 'tab-active' : 'tab-inactive'}`}
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
              История
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`tab whitespace-nowrap ${activeTab === 'preferences' ? 'tab-active' : 'tab-inactive'}`}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
              Предпочтения
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`tab whitespace-nowrap ${activeTab === 'settings' ? 'tab-active' : 'tab-inactive'}`}
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" />
              Настройки
            </button>
          </div>

          {/* Content */}
          <div className="card">
            {activeTab === 'profile' && (
              <div>
                <h2 className="heading-2 mb-2">Ваши данные</h2>
                <p className="text-caption mb-6">
                  Обновите информацию о себе для лучшего подбора вариантов
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Имя
                    </label>
                    <input
                      type="text"
                      className="input"
                      defaultValue={user?.firstName ?? ''}
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      className="input"
                      defaultValue={user?.lastName ?? ''}
                      placeholder="Ваша фамилия"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="input"
                      defaultValue={user?.email ?? ''}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      className="input"
                      defaultValue={user?.phone ?? ''}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <button className="btn btn-primary w-full sm:w-auto">
                    Сохранить изменения
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Мои бронирования</h2>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Пока нет бронирований</p>
                  <p className="text-sm text-gray-500">
                    Когда вы забронируете жилье, оно появится здесь
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Избранное</h2>
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Пока нет избранных объявлений</p>
                  <p className="text-sm text-gray-500">
                    Добавляйте понравившиеся варианты в избранное, чтобы вернуться к ним позже
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Сообщения</h2>
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Пока нет сообщений</p>
                  <p className="text-sm text-gray-500">
                    Переписка с арендодателями будет отображаться здесь
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Уведомления</h2>
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Пока нет уведомлений</p>
                  <p className="text-sm text-gray-500">
                    Мы сообщим вам о новых бронированиях, сообщениях и важных обновлениях
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">История поисков</h2>
                {searchHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">История поисков пуста</p>
                    <p className="text-sm text-gray-500">
                      Ваши поиски будут сохраняться здесь для удобного доступа
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchHistory.map((session: any) => (
                      <div
                        key={session.id}
                        className="border border-border rounded-lg p-4 hover:bg-bg transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {session.searchParams.city || 'Не указан город'}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {new Date(session.createdAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                        <div className="text-sm text-text-secondary">
                          {session.searchParams.checkIn && session.searchParams.checkOut && (
                            <span>
                              {new Date(session.searchParams.checkIn).toLocaleDateString('ru-RU')} -{' '}
                              {new Date(session.searchParams.checkOut).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                        {session.recommendations && session.recommendations.length > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="text-primary">
                              Найдено {session.recommendations.length} рекомендаций
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Ваши предпочтения</h2>
                {preferences ? (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 mb-6">
                      Настройте приоритеты, чтобы мы подбирали варианты, которые вам действительно подходят.
                    </p>
                    <div>
                      <h3 className="font-semibold mb-4 text-gray-900">Приоритеты поиска</h3>
                      {preferences.preferences?.priorities && (
                        <div className="space-y-4">
                          {Object.entries(preferences.preferences.priorities).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 capitalize">
                                  {key === 'quiet' ? 'Тишина' :
                                   key === 'center' ? 'Центр города' :
                                   key === 'comfort' ? 'Комфорт' :
                                   key === 'price' ? 'Низкая цена' : key}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {Math.round(value * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={value}
                                onChange={async (e) => {
                                  const newValue = parseFloat(e.target.value)
                                  const updated = {
                                    ...preferences.preferences.priorities,
                                    [key]: newValue,
                                  }
                                  try {
                                    await recommendationAPI.savePreferences({
                                      ...preferences.preferences,
                                      priorities: updated,
                                    })
                                    setPreferences({
                                      ...preferences,
                                      preferences: {
                                        ...preferences.preferences,
                                        priorities: updated,
                                      },
                                    })
                                  } catch (error) {
                                    console.error('Error updating preferences:', error)
                                  }
                                }}
                                className="w-full"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Предпочтения ещё не настроены</p>
                    <p className="text-sm text-gray-500">
                      Используйте умный поиск, чтобы мы автоматически определили ваши предпочтения
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Настройки</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Выберите, какие уведомления вы хотите получать
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-primary rounded focus:ring-primary" />
                    <div>
                      <span className="font-medium text-gray-900">Email уведомления</span>
                      <p className="text-sm text-gray-500">Получайте уведомления на почту о бронированиях и сообщениях</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input type="checkbox" className="w-5 h-5 text-primary rounded focus:ring-primary" />
                    <div>
                      <span className="font-medium text-gray-900">Telegram уведомления</span>
                      <p className="text-sm text-gray-500">Получайте уведомления в Telegram о важных событиях</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
