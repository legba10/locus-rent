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
        
        {/* Hero Section - Экономия и выгода */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 px-4 overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Платите меньше за каждое бронирование
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
                LOCUS берёт 7% — другие сервисы забирают до 25% с каждого бронирования
              </p>
            </div>

            {/* Усиливающий блок с экономией */}
            <div className="max-w-2xl mx-auto mb-10 bg-white rounded-2xl shadow-xl border-2 border-blue-100 p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Бронирование на 30 000 ₽</h3>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">LOCUS</div>
                  <div className="text-3xl font-bold text-primary">2 100 ₽</div>
                  <div className="text-xs text-gray-500 mt-1">комиссия 7%</div>
                </div>
                <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                  <div className="text-sm text-gray-600 mb-2">Другие сервисы</div>
                  <div className="text-3xl font-bold text-red-600">до 7 500 ₽</div>
                  <div className="text-xs text-gray-500 mt-1">комиссия до 25%</div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  👉 Разницу вы оставляете себе
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) {
                    router.push('/landlord/listings/new-stepper')
                  } else {
                    router.push('/register?next=/landlord/listings/new-stepper')
                  }
                }}
                className="inline-flex items-center gap-2 bg-primary text-white px-10 py-4 rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                <Zap className="w-6 h-6" />
                Начать экономить
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('home-search')
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  } else {
                    router.push('/search')
                  }
                }}
                className="inline-flex items-center gap-2 px-10 py-4 border-2 border-primary text-primary rounded-xl hover:bg-primary/5 transition-all font-semibold text-lg"
              >
                <Search className="w-6 h-6" />
                Найти жильё
              </button>
            </div>

            {/* Поиск */}
            <div id="home-search" className="max-w-4xl mx-auto">
              <SearchBar />
            </div>
          </div>
        </section>

        {/* Почему LOCUS выгоднее */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
              Почему LOCUS выгоднее
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  icon: TrendingUp, 
                  title: 'Меньше комиссия', 
                  desc: 'Вы платите за сервис, а не за бренд' 
                },
                { 
                  icon: Shield, 
                  title: 'Честные условия', 
                  desc: 'Без скрытых платежей и навязанных услуг' 
                },
                { 
                  icon: Zap, 
                  title: 'Полный контроль', 
                  desc: 'Вы управляете ценой, календарём и правилами' 
                },
                { 
                  icon: Heart, 
                  title: 'Поддержка без ботов', 
                  desc: 'Живые ответы, а не автоответчики' 
                },
              ].map((item, i) => (
                <div key={i} className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
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
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
              Как это работает
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Search, title: 'Выберите параметры', desc: 'Укажите город, даты заезда и выезда, количество гостей.' },
                { icon: Calendar, title: 'Сравните варианты', desc: 'Посмотрите подходящие варианты, сравните цены и удобства.' },
                { icon: CheckCircle2, title: 'Забронируйте', desc: 'Забронируйте понравившийся вариант и получите подтверждение.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-5 h-5 text-blue-600" />
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


        {/* Сравнение с конкурентами - Карточки */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
              Сколько вы теряете на комиссиях
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Сравните условия LOCUS с крупными площадками и посчитайте свою экономию
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* LOCUS - Выделенная карточка */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white border-4 border-blue-400 shadow-2xl transform scale-105 md:scale-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-3xl font-bold">LOCUS</h3>
                  <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-semibold">
                    Выгоднее
                  </span>
                </div>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <span>Комиссия ниже рынка</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <span>Без навязанных услуг</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <span>Вы платите только за результат</span>
                  </li>
                </ul>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-sm text-blue-100 mb-1">В среднем экономия</div>
                  <div className="text-2xl font-bold">до 50% комиссии</div>
                </div>
              </div>

              {/* Другие сервисы */}
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Крупные площадки</h3>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <X className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-500" />
                    <span className="text-gray-700">Комиссия до 25%</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-500" />
                    <span className="text-gray-700">Сложные условия</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-500" />
                    <span className="text-gray-700">Переплата с каждого бронирования</span>
                  </li>
                </ul>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Суточно.ру, Авито, Циан</div>
                  <div className="text-lg font-semibold text-gray-900">15–25% комиссии</div>
                </div>
              </div>
            </div>

            {/* Визуальный акцент на экономию */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-10 text-white text-center shadow-xl">
              <div className="text-5xl md:text-6xl font-bold mb-3">
                До 5 000 ₽ экономии
              </div>
              <div className="text-xl md:text-2xl mb-2">с одного бронирования</div>
              <div className="text-green-100 text-sm">
                На примере средней брони 30 000 ₽
              </div>
            </div>
          </div>
        </section>

        {/* Блок для собственников - Обновлённая концепция */}
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 md:p-16 text-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Вы зарабатываете больше — не сервис
                  </h2>
                  <p className="text-xl mb-8 text-blue-50 leading-relaxed">
                    LOCUS не зарабатывает на каждом вашем шаге. Мы берём минимальную комиссию — и только когда вы реально зарабатываете.
                  </p>
                  <ul className="space-y-4 mb-8">
                    {[
                      'Комиссия ниже рынка',
                      'Прозрачные условия',
                      'Никаких скрытых сборов',
                      'Вы платите меньше — всегда',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <span className="text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAuthenticated) {
                        router.push('/landlord/listings/new-stepper')
                      } else {
                        router.push('/register?next=/landlord/listings/new-stepper')
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <HomeIcon className="w-5 h-5" />
                    Разместить объявление и сравнить
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: TrendingUp, value: '7%', label: 'Комиссия' },
                    { icon: Users, value: '24/7', label: 'Поддержка' },
                    { icon: Star, value: '100%', label: 'Контроль' },
                    { icon: Calendar, value: 'Быстро', label: 'Бронирования' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                      <stat.icon className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-3xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm text-blue-100">{stat.label}</div>
                    </div>
                  ))}
                </div>
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
