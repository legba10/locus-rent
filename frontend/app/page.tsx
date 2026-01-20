'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'
import WelcomeAnimation from '@/components/WelcomeAnimation'
import Logo from '@/components/Logo'

// Lazy load MapView для оптимизации
const MapView = dynamic(() => import('@/components/MapView'), { 
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-100 rounded-xl animate-pulse" />
})
import { ListingCardSkeleton } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import { Sparkles, MapPin, Home as HomeIcon, Search, CheckCircle2, Calendar, Shield, Zap, Heart, TrendingUp, Users, Star, X } from 'lucide-react'
import { listingsAPI } from '@/lib/api'
import Link from 'next/link'
import { toast } from '@/components/Toast'
import { useAuthStore } from '@/lib/store'

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Проверяем, показывали ли уже welcome-анимацию в этой сессии
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome')
    if (hasSeenWelcome) {
      setShowWelcome(false)
    }
    loadListings()
  }, [])

  const handleWelcomeComplete = () => {
    setShowWelcome(false)
    sessionStorage.setItem('hasSeenWelcome', 'true')
  }

  const loadListings = async () => {
    try {
      setLoading(true)
      const response = await listingsAPI.getAll()
      // Backend возвращает массив напрямую или { data: [] }
      let listings: any[] = []
      if (Array.isArray(response.data)) {
        listings = response.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        listings = response.data.data
      }
      setListings(listings)
    } catch (error: any) {
      console.error('Error loading listings:', error)
      const errorMsg = error.userMessage || error.message || 'Ошибка загрузки объявлений'
      toast(errorMsg, 'error')
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showWelcome && <WelcomeAnimation onComplete={handleWelcomeComplete} />}
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/30 w-full overflow-x-hidden">
        {/* Hero Section - Поиск как главный элемент */}
        <section className="relative bg-gradient-to-br from-blue-50/30 via-white to-blue-50/30 py-8 sm:py-12 md:py-16 px-3 sm:px-4 w-full overflow-x-hidden">
          <div className="container mx-auto max-w-5xl relative z-10 w-full">
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight px-2">
                Найти жильё для аренды
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
                Прямое общение с владельцами без посредников
              </p>
            </div>

            {/* Поисковая панель - главный элемент */}
            <div className="max-w-4xl mx-auto w-full mb-4 sm:mb-6">
              <SearchBar />
            </div>
            
            {/* Умный поиск - UI-акцент */}
            <div className="max-w-4xl mx-auto">
              <Link 
                href="/smart-search"
                className="block bg-white/80 backdrop-blur-sm border border-primary/20 rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold text-primary">Умный поиск</span> — найдём идеальный вариант автоматически
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Блок преимуществ */}
        <section className="py-10 sm:py-12 md:py-14 px-4 bg-white w-full">
          <div className="container-custom max-w-6xl">
            <h2 className="heading-2 mb-6 sm:mb-8 text-center">Почему выбирают LOCUS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { 
                  icon: Zap, 
                  title: 'Минимальная комиссия', 
                  desc: 'Прозрачные условия и низкие тарифы' 
                },
                { 
                  icon: Shield, 
                  title: 'Прямое общение', 
                  desc: 'Связывайтесь с владельцами напрямую без посредников' 
                },
                { 
                  icon: Heart, 
                  title: 'Удобное управление', 
                  desc: 'Контролируйте цены, календарь и условия бронирования' 
                },
              ].map((item, i) => (
                <div key={`advantage-${i}`} className="card card-hover">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="heading-3 mb-2">{item.title}</h3>
                  <p className="text-body">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Популярные города */}
        <section className="py-8 sm:py-12 px-4 bg-gray-50 w-full">
          <div className="container-custom max-w-6xl">
            <h2 className="heading-2 mb-4 sm:mb-6 text-center">Популярные направления</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {[
                'Москва', 'Санкт-Петербург', 'Сочи', 'Казань', 'Екатеринбург', 'Краснодар',
                'Новосибирск', 'Нижний Новгород', 'Ростов-на-Дону', 'Уфа', 'Воронеж', 'Красноярск',
              ].map((city) => (
                <Link
                  key={city}
                  href={`/search?city=${encodeURIComponent(city)}`}
                  className="btn btn-secondary text-sm sm:text-base h-10 sm:h-11 flex items-center justify-center whitespace-nowrap cursor-pointer"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Кратко о процессе */}
        <section className="py-8 sm:py-12 md:py-16 px-4 bg-white w-full">
          <div className="container-custom max-w-5xl">
            <h2 className="heading-2 mb-6 sm:mb-8 text-center">Как забронировать жильё</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: Search, title: 'Выберите параметры', desc: 'Укажите город, даты заезда и выезда, количество гостей' },
                { icon: Calendar, title: 'Сравните варианты', desc: 'Изучите предложения, сравните цены, удобства и расположение' },
                { icon: CheckCircle2, title: 'Бронируйте напрямую', desc: 'Свяжитесь с владельцем и забронируйте без посредников' },
              ].map((step, i) => (
                <div key={`step-${i}`} className="card">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="heading-3 mb-1">{step.title}</h3>
                      <p className="text-caption">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* Блок для арендодателей */}
        <section className="py-12 md:py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 px-2">
                  Сдаёте жильё?
                </h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto px-2 mb-6">
                  Размещение бесплатно. Комиссия только с бронирований. Прямое общение с гостями.
                </p>
                <Link
                  href={isAuthenticated ? '/landlord/listings/new-stepper' : '/register?next=/landlord/listings/new-stepper'}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-all font-semibold shadow-md hover:shadow-lg cursor-pointer"
                >
                  <HomeIcon className="w-5 h-5" />
                  Разместить объявление
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Доступные варианты */}
        <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-14 w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {listings.length > 0 ? 'Доступные варианты' : 'Начните поиск'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {listings.length > 0 ? `${listings.length} ${listings.length === 1 ? 'объявление' : listings.length < 5 ? 'объявления' : 'объявлений'}` : 'Используйте поиск выше, чтобы найти жильё'}
              </p>
            </div>
            {listings.length > 0 && (
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md transition-all font-medium cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Список
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md transition-all font-medium cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Карта
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : viewMode === 'map' ? (
            <MapView listings={listings} />
          ) : (
            <>
              {listings.length === 0 ? (
                <EmptyState
                  icon={HomeIcon}
                  title="Пока нет объявлений"
                  description="Начните поиск или создайте объявление, чтобы увидеть варианты жилья"
                  action={{
                    label: 'Найти жильё',
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
        </section>

      </div>
    </>
  )
}
