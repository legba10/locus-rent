'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Calendar, Users } from 'lucide-react'
import { citiesAPI } from '@/lib/api'

const POPULAR_CITIES = [
  { id: 'popular-moscow', name: 'Москва', region: 'Россия' },
  { id: 'popular-spb', name: 'Санкт-Петербург', region: 'Россия' },
  { id: 'popular-sochi', name: 'Сочи', region: 'Россия' },
  { id: 'popular-kazan', name: 'Казань', region: 'Россия' },
  { id: 'popular-ekb', name: 'Екатеринбург', region: 'Россия' },
]

export default function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [showFilters, setShowFilters] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cityError, setCityError] = useState('')

  const LAST_CITY_KEY = 'locus_last_city'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const lastCity = localStorage.getItem(LAST_CITY_KEY)
    if (lastCity) {
      setSearchQuery(lastCity)
      setSelectedCity(lastCity)
    }
  }, [])

  const handleSearch = () => {
    if (!selectedCity) {
      setCityError('Выберите город из списка')
      return
    }

    if (selectedCity && typeof window !== 'undefined') {
      localStorage.setItem(LAST_CITY_KEY, selectedCity)
    }
    const params = new URLSearchParams()
    if (selectedCity) params.set('city', selectedCity)
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (guests) params.set('guests', guests.toString())
    
    router.push(`/search?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCityInputChange = async (value: string) => {
    setSearchQuery(value)
    setSelectedCity(null)
    if (cityError) setCityError('')
    if (value.length >= 2) {
      try {
        const response = await citiesAPI.search(value, 5)
        setCitySuggestions(response.data || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('City search error:', error)
      }
    } else {
      // Пустой ввод — показываем популярные города
      setCitySuggestions(POPULAR_CITIES)
      setShowSuggestions(true)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Location */}
          <div className="flex-1 relative">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Город
            </label>
            <input
              type="text"
              placeholder="Город..."
              value={searchQuery}
              onChange={(e) => handleCityInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                if (citySuggestions.length === 0) {
                  setCitySuggestions(POPULAR_CITIES)
                }
                setShowSuggestions(true)
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 150)
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {cityError && (
              <p className="mt-1 text-xs text-red-600">{cityError}</p>
            )}
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {citySuggestions.map((city: any) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(city.name)
                      setSelectedCity(city.name)
                      setCityError('')
                      setShowSuggestions(false)
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(LAST_CITY_KEY, city.name)
                      }
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{city.name}</span>
                    {city.region && (
                      <span className="text-sm text-gray-500">({city.region})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Заезд
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Выезд
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Guests */}
          <div className="w-full lg:w-32">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              Гостей
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full lg:w-auto bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">Найти</span>
            </button>
          </div>
        </div>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-4 text-sm text-primary hover:text-primary-dark transition-colors font-medium"
        >
          {showFilters ? '▲ Скрыть фильтры' : '▼ Показать фильтры'}
        </button>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цена за ночь
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="От"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип жилья
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>Любой</option>
                  <option>Квартира</option>
                  <option>Дом</option>
                  <option>Студия</option>
                  <option>Апартаменты</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Рейтинг
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>Любой</option>
                  <option>4+ ⭐</option>
                  <option>4.5+ ⭐</option>
                  <option>5 ⭐</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Удобства
                </label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>Все</option>
                  <option>Wi-Fi</option>
                  <option>Парковка</option>
                  <option>Кухня</option>
                  <option>Кондиционер</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
