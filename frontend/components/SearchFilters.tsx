'use client'

import { useState } from 'react'
import { X, Star, Wifi, Car, Utensils, Wind, Tv, Coffee, Droplet, Bed, Home, Building2 } from 'lucide-react'

interface SearchFiltersProps {
  onClose?: () => void
  className?: string
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
  { value: '4', label: '4+ ⭐', min: 4 },
  { value: '4.5', label: '4.5+ ⭐', min: 4.5 },
  { value: '5', label: '5 ⭐', min: 5 },
]

export default function SearchFilters({ onClose, className = '' }: SearchFiltersProps) {
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [propertyType, setPropertyType] = useState('any')
  const [rating, setRating] = useState('any')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

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

  const hasActiveFilters =
    priceMin || priceMax || propertyType !== 'any' || rating !== 'any' || selectedAmenities.length > 0

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Фильтры поиска</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              Сбросить
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Цена за ночь (₽)
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="От"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="number"
              placeholder="До"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Удобства
          </label>
          <div className="space-y-4">
            {Object.entries(AMENITY_GROUPS).map(([key, group]) => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{group.title}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                            ? 'border-primary bg-blue-50 text-primary'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{amenity.name}</span>
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
    </div>
  )
}
