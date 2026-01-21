'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, Loader2 } from 'lucide-react'
import { useCitySearch, City } from '@/lib/hooks/useCitySearch'

interface CityAutocompleteProps {
  value: string
  onChange: (city: string) => void
  onSelect: (city: string) => void
  placeholder?: string
  className?: string
  error?: string
}

export default function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Введите название города...',
  className = '',
  error,
}: CityAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [highlightedText, setHighlightedText] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  // Используем единый hook для поиска городов
  const { suggestions, loading, search, initPopular } = useCitySearch()

  useEffect(() => {
    setMounted(true)
    initPopular()
  }, [initPopular])

  // Handle input change with debounce
  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setSelectedIndex(-1)
    
    if (newValue.length >= 1) {
      setHighlightedText(newValue.trim())
      search(newValue)
    } else {
      setHighlightedText('')
      initPopular()
    }
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

  // Keyboard navigation - улучшенная обработка
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Если нет подсказок, но есть текст - показываем подсказки при ArrowDown
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && value.length >= 1) {
        e.preventDefault()
        setShowSuggestions(true)
        setSelectedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        setSelectedIndex((prev) => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : prev
          return newIndex
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        e.stopPropagation()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex])
        } else if (suggestions.length > 0 && suggestions[0]) {
          // Если ничего не выбрано, выбираем первый элемент
          handleSelect(suggestions[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
      case 'Tab':
        // При Tab просто закрываем подсказки
        setShowSuggestions(false)
        setSelectedIndex(-1)
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
    // 🔴 ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ДИАГНОСТИКИ
    return

    if (showSuggestions && inputRef.current && mounted && typeof window !== 'undefined') {
      const updatePosition = () => {
        if (!inputRef.current) return
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
      }

      updatePosition()
      // Обновляем позицию при scroll и resize
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
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
    if (value.length < 1) {
      initPopular()
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
          className="fixed z-[1060] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: window.innerWidth < 768 ? '60vh' : '16rem',
            position: 'fixed',
            willChange: 'transform',
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => {
            // Предотвращаем blur только для элементов внутри dropdown
            // Но не блокируем клики на Link элементы
            const target = e.target as HTMLElement
            if (!target.closest('a[href]')) {
              e.preventDefault()
            }
          }}
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
          className="fixed z-[1060] bg-white border border-gray-200 rounded-xl shadow-2xl p-4 text-center text-gray-500"
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
