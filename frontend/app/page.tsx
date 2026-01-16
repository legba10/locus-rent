'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
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
      const response = await listingsAPI.getAll({ limit: 12 })
      const listings = response.data?.data || []
      setListings(listings)
      if (listings.length === 0) {
        toast('Пока нет доступных объявлений', 'info')
      }
    } catch (error) {
      console.error('Error loading listings:', error)
      toast('Ошибка загрузки объявлений', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showWelcome && <WelcomeAnimation onComplete={handleWelcomeComplete} />}
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/30">
        <Header />
        
        {/* Hero Section - Поиск как главный элемент */}
        <section className="relative bg-gradient-to-br from-blue-50/30 via-white to-blue-50/30 py-12 md:py-20 px-4 overflow-hidden">
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
                Найдите жильё для короткой аренды
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                Укажите город, даты и гостей — мы покажем подходящие варианты.
              </p>
            </div>

            {/* Поисковая панель - главный элемент */}
            <div className="max-w-4xl mx-auto mb-6">
              <SearchBar />
            </div>

            {/* CTA кнопка */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector('[id="home-search"] button[type="submit"], [id="home-search"] button:has(svg)')
                  if (el) {
                    (el as HTMLElement).click()
                  } else {
                    router.push('/search')
                  }
                }}
                className="inline-flex items-center gap-2 bg-primary text-white px-8 md:px-10 py-3 md:py-4 rounded-xl hover:bg-primary-dark transition-all shadow-md hover:shadow-lg font-semibold text-base md:text-lg"
              >
                <Search className="w-5 h-5 md:w-6 md:h-6" />
                Найти жильё
              </button>
            </div>
          </div>
        </section>

        {/* Блок доверия/выгоды */}
        <section className="py-12 md:py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8 text-center">
              Преимущества LOCUS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  icon: Shield, 
                  title: 'Безопасность', 
                  desc: 'Все платежи защищены. Ваши данные в безопасности.' 
                },
                { 
                  icon: Zap, 
                  title: 'Экономия', 
                  desc: 'Честные условия без скрытых сборов.' 
                },
                { 
                  icon: Heart, 
                  title: 'Поддержка', 
                  desc: 'Круглосуточная поддержка. Мы всегда готовы помочь.' 
                },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Популярные города */}
        <section className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Популярные города
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                'Москва', 'Санкт-Петербург', 'Сочи', 'Казань', 'Екатеринбург', 'Краснодар',
                'Новосибирск', 'Нижний Новгород', 'Ростов-на-Дону', 'Уфа', 'Воронеж', 'Красноярск',
              ].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    router.push(`/search?city=${encodeURIComponent(city)}`)
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-primary hover:text-white rounded-lg transition-all text-center font-medium text-gray-700 hover:shadow-md border border-gray-100 hover:border-primary"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Кратко о процессе */}
        <section className="py-12 md:py-16 px-4 bg-white">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8 text-center">
              Как это работает
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Search, title: 'Выбираете город и даты', desc: 'Укажите город, даты заезда и выезда, количество гостей.' },
                { icon: Calendar, title: 'Сравниваете варианты', desc: 'Посмотрите подходящие варианты, сравните цены и удобства.' },
                { icon: CheckCircle2, title: 'Бронируете онлайн', desc: 'Общайтесь с владельцем и бронируйте напрямую.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Сравнение с конкурентами - Справка */}
        <section className="py-12 md:py-16 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8 text-center">
              Сравнение с другими сервисами
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Платформа</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Комиссия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="bg-blue-50/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">LOCUS</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-primary">Минимальная</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-gray-700">Суточно.ру</td>
                      <td className="px-4 py-4 text-center text-gray-600">15–20%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-gray-700">Авито</td>
                      <td className="px-4 py-4 text-center text-gray-600">15–25%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 text-gray-700">Циан</td>
                      <td className="px-4 py-4 text-center text-gray-600">До 20%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-4 py-4 border-t border-gray-200">
                <p className="text-sm text-center text-gray-700">
                  LOCUS — минимальная комиссия, прозрачные условия, полный контроль над календарём и ценой.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Блок для арендодателей */}
        <section className="py-12 md:py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Сдаёте жильё?
                </h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  Размещайте объявления бесплатно и платите комиссию только с подтверждённых бронирований. Без скрытых сборов.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push('/landlord/listings/new-stepper')
                    } else {
                      router.push('/register?next=/landlord/listings/new-stepper')
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary-dark transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  <HomeIcon className="w-5 h-5" />
                  Разместить объявление
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Доступные варианты */}
        <main className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {listings.length > 0 ? 'Доступные варианты' : 'Начните поиск'}
              </h2>
              <p className="text-gray-600">
                {listings.length > 0 ? `${listings.length} объявлений найдено` : 'Используйте поиск выше, чтобы найти жильё'}
              </p>
            </div>
            {listings.length > 0 && (
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md transition-all font-medium ${
                    viewMode === 'list'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Список
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md transition-all font-medium ${
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
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <Logo size="md" showText={true} className="justify-center mb-4" />
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                LOCUS — умный сервис подбора жилья для суточной аренды
              </p>
              <div className="flex justify-center gap-6 text-sm text-gray-600">
                <Link href="/smart-search" className="hover:text-primary transition-colors">
                  Умный поиск
                </Link>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Разместить объявление
                </Link>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Войти
                </Link>
              </div>
              <p className="text-gray-500 text-sm mt-8">
                © {new Date().getFullYear()} LOCUS. Все права защищены.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
