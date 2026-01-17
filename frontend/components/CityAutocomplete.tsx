'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { citiesAPI } from '@/lib/api'

interface City {
  id: number
  name: string
  region?: string
}

interface CityAutocompleteProps {
  value: string
  onChange: (city: string) => void
  onSelect: (city: string) => void
  placeholder?: string
  className?: string
  error?: string
}

const POPULAR_CITIES: City[] = [
  { id: 1, name: 'Москва', region: 'Московская область' },
  { id: 2, name: 'Санкт-Петербург', region: 'Ленинградская область' },
  { id: 3, name: 'Сочи', region: 'Краснодарский край' },
  { id: 4, name: 'Казань', region: 'Республика Татарстан' },
  { id: 5, name: 'Екатеринбург', region: 'Свердловская область' },
  { id: 6, name: 'Новосибирск', region: 'Новосибирская область' },
  { id: 7, name: 'Краснодар', region: 'Краснодарский край' },
  { id: 8, name: 'Нижний Новгород', region: 'Нижегородская область' },
]

export default function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Введите название города...',
  className = '',
  error,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [highlightedText, setHighlightedText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Debounced search function
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions(POPULAR_CITIES)
      setHighlightedText('')
      return
    }

    setLoading(true)
    try {
      const response = await citiesAPI.search(query, 20)
      const cities = response.data || []
      setSuggestions(cities)
      setHighlightedText(query)
    } catch (error) {
      console.error('City search error:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle input change with debounce
  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setSelectedIndex(-1)

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      searchCities(newValue)
    }, 250)
  }

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text

    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)

    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 text-gray-900 font-medium px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  // Handle city selection
  const handleSelect = (city: City) => {
    onChange(city.name)
    onSelect(city.name)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && value.length >= 2) {
        setShowSuggestions(true)
        setSelectedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  // Show popular cities on focus if input is empty
  const handleFocus = () => {
    if (value.length < 2) {
      setSuggestions(POPULAR_CITIES)
    }
    setShowSuggestions(true)
  }

  // Hide suggestions on blur (with delay to allow clicks)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-9 sm:pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base min-h-[44px] ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
          }`}
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto left-0 right-0"
        >
          {suggestions.map((city, index) => (
            <button
              key={city.id}
              type="button"
              onClick={() => handleSelect(city)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-l-primary' : ''
              }`}
            >
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {highlightedText ? highlightMatch(city.name, highlightedText) : city.name}
                </div>
                {city.region && (
                  <div className="text-sm text-gray-500 truncate">{city.region}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && !loading && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          Город не найден
        </div>
      )}
    </div>
  )
}
