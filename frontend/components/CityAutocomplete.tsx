'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

// Популярные города для показа при пустом запросе
const POPULAR_CITIES: City[] = [
  { id: 1, name: 'Москва', region: 'Москва' },
  { id: 2, name: 'Санкт-Петербург', region: 'Ленинградская область' },
  { id: 3, name: 'Сочи', region: 'Краснодарский край' },
  { id: 4, name: 'Казань', region: 'Республика Татарстан' },
  { id: 5, name: 'Екатеринбург', region: 'Свердловская область' },
  { id: 6, name: 'Новосибирск', region: 'Новосибирская область' },
  { id: 7, name: 'Краснодар', region: 'Краснодарский край' },
  { id: 8, name: 'Нижний Новгород', region: 'Нижегородская область' },
  { id: 9, name: 'Сургут', region: 'Ханты-Мансийский автономный округ - Югра' },
  { id: 10, name: 'Нижневартовск', region: 'Ханты-Мансийский автономный округ - Югра' },
  { id: 11, name: 'Ноябрьск', region: 'Ямало-Ненецкий автономный округ' },
  { id: 12, name: 'Новый Уренгой', region: 'Ямало-Ненецкий автономный округ' },
  { id: 13, name: 'Салехард', region: 'Ямало-Ненецкий автономный округ' },
  { id: 14, name: 'Ханты-Мансийск', region: 'Ханты-Мансийский автономный округ - Югра' },
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
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Debounced search function
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions(POPULAR_CITIES.slice(0, 10))
      setHighlightedText('')
      return
    }

    if (query.length === 1) {
      // При одном символе показываем популярные города, которые начинаются с этой буквы
      const filtered = POPULAR_CITIES.filter(city => 
        city.name.toLowerCase().startsWith(query.toLowerCase())
      )
      setSuggestions(filtered.length > 0 ? filtered : POPULAR_CITIES.slice(0, 10))
      setHighlightedText('')
      return
    }

    setLoading(true)
    try {
      const response = await citiesAPI.search(query, 15)
      const cities = response.data || []
      
      // Если API вернул результаты, сортируем по релевантности
      if (cities.length > 0) {
        const sortedCities = (cities as City[]).sort((a: City, b: City) => {
          const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1
          const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1
          if (aStarts !== bStarts) return aStarts - bStarts
          return a.name.localeCompare(b.name, 'ru')
        })
        setSuggestions(sortedCities.slice(0, 15))
      } else {
        // Если нет результатов из API, показываем популярные
        setSuggestions(POPULAR_CITIES.slice(0, 10))
      }
      setHighlightedText(query)
    } catch (error) {
      console.error('City search error:', error)
      // При ошибке показываем популярные города
      setSuggestions(POPULAR_CITIES.slice(0, 10))
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

  // Scroll selected item into view - убрано scrollIntoView для предотвращения прыжков экрана
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement
      const container = suggestionsRef.current
      if (selectedElement && container) {
        // Плавная прокрутка без изменения позиции страницы
        const containerRect = container.getBoundingClientRect()
        const elementRect = selectedElement.getBoundingClientRect()
        
        if (elementRect.top < containerRect.top) {
          container.scrollTop -= (containerRect.top - elementRect.top + 10)
        } else if (elementRect.bottom > containerRect.bottom) {
          container.scrollTop += (elementRect.bottom - containerRect.bottom + 10)
        }
      }
    }
  }, [selectedIndex])

  // Update dropdown position - фиксируем под инпутом и ограничиваем по viewport
  useEffect(() => {
    if (showSuggestions && inputRef.current && mounted && typeof window !== 'undefined') {
      const rect = inputRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      const left = Math.max(8, Math.min(rect.left, viewportWidth - rect.width - 8))
      const width = Math.min(rect.width, viewportWidth - 16)
      const maxHeightPx = Math.floor(viewportHeight * 0.6)

      // всегда под инпутом, но если не влезает — прижимаем вверх так, чтобы dropdown оставался в пределах экрана
      const preferredTop = rect.bottom + 4
      const top = Math.min(preferredTop, Math.max(8, viewportHeight - maxHeightPx - 8))

      setDropdownPosition({ top, left, width })
    } else {
      setDropdownPosition(null)
    }
  }, [showSuggestions, mounted])

  // Lock body scroll while dropdown is open on mobile
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    const isMobile = window.innerWidth < 768
    if (!isMobile) return

    if (showSuggestions) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [showSuggestions, mounted])

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
    <div className={`relative w-full ${className}`} style={{ zIndex: 1 }}>
      {/* Без position:absolute в форме: иконки через flex layout */}
      <div
        className={`w-full border rounded-lg bg-white transition-all flex items-center gap-2 px-3 sm:px-4 ${
          error ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-500' : 'border-gray-200 focus-within:ring-2 focus-within:ring-primary'
        }`}
      >
        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm sm:text-base min-h-[44px] sm:min-h-[48px] py-2.5 sm:py-3"
        />
        {loading && (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {mounted && showSuggestions && suggestions.length > 0 && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div
          ref={suggestionsRef}
          className="fixed z-[10002] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: window.innerWidth < 768 ? '60vh' : '16rem',
            position: 'fixed',
            willChange: 'transform'
          }}
          onMouseDown={(e) => e.preventDefault()}
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
        </div>,
        document.body
      )}

      {mounted && showSuggestions && !loading && suggestions.length === 0 && value.length >= 2 && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed z-[10002] bg-white border border-gray-200 rounded-xl shadow-2xl p-4 text-center text-gray-500"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            position: 'fixed'
          }}
        >
          Город не найден
        </div>,
        document.body
      )}
    </div>
  )
}
