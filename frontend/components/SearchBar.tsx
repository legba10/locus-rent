'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import CityAutocomplete from './CityAutocomplete'
import DateRangePicker from './DateRangePicker'
import GuestsStepper from './GuestsStepper'
import SearchFilters from './SearchFilters'

export default function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [showFilters, setShowFilters] = useState(false)
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

  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    setCityError('')
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_CITY_KEY, city)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Location */}
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              Город
            </label>
            <CityAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSelect={handleCitySelect}
              placeholder="Введите название города..."
              error={cityError}
            />
          </div>

          {/* Dates */}
          <div className="flex-1">
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              minDate={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Guests */}
          <div className="w-full lg:w-40">
            <GuestsStepper
              value={guests}
              onChange={setGuests}
              min={1}
              max={20}
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
            <SearchFilters />
          </div>
        )}
      </div>
    </div>
  )
}
