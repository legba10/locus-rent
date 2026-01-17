'use client'

import { useState, useEffect } from 'react'
import { X, Star, Wifi, Car, Utensils, Wind, Tv, Coffee, Droplet, Bed, Home, Building2, Filter } from 'lucide-react'

interface SearchFiltersProps {
  onClose?: () => void
  className?: string
  isMobile?: boolean
  initialFilters?: {
    priceMin?: string
    priceMax?: string
    propertyType?: string
    rating?: string
    amenities?: string[]
  }
  onApply?: (filters: {
    priceMin?: string
    priceMax?: string
    propertyType?: string
    rating?: string
    amenities?: string[]
  }) => void
}

const AMENITY_GROUPS = {
  basic: {
    title: 'Основные',
    items: [
      { id: 'wifi', name: 'Wi-Fi', icon: Wifi },
      { id: 'parking', name: 'Парковка', icon: Car },
      { id: 'kitchen', name: 'Кухня', icon: Utensils },
      { id: 'ac', name: 'Кондиционер', icon: Wind },
    ],
  },
  comfort: {
    title: 'Комфорт',
    items: [
      { id: 'tv', name: 'Телевизор', icon: Tv },
      { id: 'coffee', name: 'Кофемашина', icon: Coffee },
      { id: 'shower', name: 'Душевая', icon: Droplet },
      { id: 'bed', name: 'Удобная кровать', icon: Bed },
    ],
  },
  family: {
    title: 'Для семьи',
    items: [
      { id: 'baby', name: 'Детская кроватка', icon: Bed },
      { id: 'highchair', name: 'Стульчик для кормления', icon: Utensils },
    ],
  },
  work: {
    title: 'Для работы',
    items: [
      { id: 'desk', name: 'Рабочее место', icon: Home },
      { id: 'office', name: 'Офисное пространство', icon: Building2 },
    ],
  },
}

const PROPERTY_TYPES = [
  { value: 'any', label: 'Любой' },
  { value: 'apartment', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'studio', label: 'Студия' },
  { value: 'room', label: 'Комната' },
]

const RATING_OPTIONS = [
  { value: 'any', label: 'Любой', min: 0 },
  { value: '4', label: '4+', min: 4 },
  { value: '4.5', label: '4.5+', min: 4.5 },
  { value: '5', label: '5', min: 5 },
]

export default function SearchFilters({ onClose, className = '', isMobile = false, initialFilters, onApply }: SearchFiltersProps) {
  const [priceMin, setPriceMin] = useState(initialFilters?.priceMin || '')
  const [priceMax, setPriceMax] = useState(initialFilters?.priceMax || '')
  const [propertyType, setPropertyType] = useState(initialFilters?.propertyType || 'any')
  const [rating, setRating] = useState(initialFilters?.rating || 'any')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialFilters?.amenities || [])

  // Обновляем состояние при изменении initialFilters
  useEffect(() => {
    if (initialFilters) {
      setPriceMin(initialFilters.priceMin || '')
      setPriceMax(initialFilters.priceMax || '')
      setPropertyType(initialFilters.propertyType || 'any')
      setRating(initialFilters.rating || 'any')
      setSelectedAmenities(initialFilters.amenities || [])
    }
  }, [initialFilters])

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    )
  }

  const clearFilters = () => {
    setPriceMin('')
    setPriceMax('')
    setPropertyType('any')
    setRating('any')
    setSelectedAmenities([])
  }

  const handleApply = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Сохраняем текущую позицию скролла
    const scrollY = window.scrollY
    
    const filters = {
      priceMin: priceMin || undefined,
      priceMax: priceMax || undefined,
      propertyType: propertyType !== 'any' ? propertyType : undefined,
      rating: rating !== 'any' ? rating : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    }
    
    if (onApply) {
      onApply(filters)
    }
    
    if (onClose) {
      onClose()
    }
    
    // Восстанавливаем позицию скролла после небольшой задержки
    setTimeout(() => {
      window.scrollTo(0, scrollY)
    }, 0)
  }

  const hasActiveFilters =
    priceMin || priceMax || propertyType !== 'any' || rating !== 'any' || selectedAmenities.length > 0

  const content = (
    <div className={`${isMobile ? 'p-4' : 'p-4 sm:p-6'} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Фильтры</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary-dark transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-primary/10"
            >
              Сбросить
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Цена за ночь (₽)
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="От"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <input
              type="number"
              placeholder="До"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Тип жилья
          </label>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setPropertyType(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  propertyType === type.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Минимальный рейтинг
          </label>
          <div className="flex flex-wrap gap-2">
            {RATING_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRating(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  rating === option.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className={`w-4 h-4 ${rating === option.value ? 'fill-current' : ''}`} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Удобства
          </label>
          <div className="space-y-4">
            {Object.entries(AMENITY_GROUPS).map(([key, group]) => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{group.title}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {group.items.map((amenity) => {
                    const Icon = amenity.icon
                    const isSelected = selectedAmenities.includes(amenity.id)
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium truncate">{amenity.name}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Button - Desktop */}
      {!isMobile && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                clearFilters()
              }}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Сбросить
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            className={`${hasActiveFilters ? 'flex-1' : 'w-full'} bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-all font-semibold shadow-md hover:shadow-lg`}
          >
            Применить фильтры
          </button>
        </div>
      )}
      
      {/* Apply Button - Mobile */}
      {isMobile && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white pb-4">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                clearFilters()
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Сбросить
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            className={`${hasActiveFilters ? 'flex-1' : 'w-full'} bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-all font-semibold shadow-md hover:shadow-lg`}
          >
            Применить
          </button>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        {/* Bottom Sheet */}
        <div className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      {content}
    </div>
  )
}
