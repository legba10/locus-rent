'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DateRangePickerProps {
  checkIn: string
  checkOut: string
  onCheckInChange: (date: string) => void
  onCheckOutChange: (date: string) => void
  minDate?: string
  className?: string
}

export default function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeField, setActiveField] = useState<'checkIn' | 'checkOut' | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [calendarPosition, setCalendarPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null)
  const [mounted, setMounted] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const checkInRef = useRef<HTMLButtonElement>(null)
  const checkOutRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const today = new Date()
  const minDateObj = minDate ? new Date(minDate) : today
  minDateObj.setHours(0, 0, 0, 0)

  // Update calendar position (desktop and mobile)
  useEffect(() => {
    // 🔴 ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ДИАГНОСТИКИ
    return

    if (isOpen && activeField && mounted && typeof window !== 'undefined') {
      const updatePosition = () => {
        const activeRef = activeField === 'checkIn' ? checkInRef.current : checkOutRef.current
        if (activeRef) {
          const rect = activeRef.getBoundingClientRect()
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          const isMobile = viewportWidth < 768
          
          if (isMobile) {
            // Mobile: bottom sheet - всегда снизу, но проверяем, что не перекрывает элементы выше
            // Вычисляем примерную высоту календаря (85vh max)
            const calendarMaxHeight = Math.min(viewportHeight * 0.85, 600)
            const spaceBelow = viewportHeight - rect.bottom
            const spaceAbove = rect.top
            
            // Если снизу места мало, но сверху есть - открываем сверху
            if (spaceBelow < calendarMaxHeight && spaceAbove > spaceBelow && spaceAbove > 200) {
              setCalendarPosition({
                top: Math.max(16, rect.top - calendarMaxHeight - 8),
                left: 0,
                placement: 'top'
              })
            } else {
              // Mobile: всегда снизу экрана, fixed bottom: 0
              setCalendarPosition({
                top: 0,
                left: 0,
                placement: 'bottom'
              })
            }
          } else {
            // Desktop: fixed positioning relative to viewport
            const calendarWidth = 700
            const calendarHeight = 400 // примерная высота
            const spaceBelow = viewportHeight - rect.bottom
            const spaceAbove = rect.top
            
            // Проверяем, помещается ли снизу
            if (spaceBelow >= calendarHeight || spaceBelow >= spaceAbove) {
              // Открываем снизу
              setCalendarPosition({
                top: rect.bottom + 8,
                left: Math.max(8, Math.min(rect.left, viewportWidth - calendarWidth - 8)),
                placement: 'bottom'
              })
            } else {
              // Открываем сверху
              setCalendarPosition({
                top: rect.top - calendarHeight - 8,
                left: Math.max(8, Math.min(rect.left, viewportWidth - calendarWidth - 8)),
                placement: 'top'
              })
            }
          }
        }
      }
      updatePosition()
      const handleScroll = () => requestAnimationFrame(updatePosition)
      const handleResize = () => requestAnimationFrame(updatePosition)
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    } else {
      setCalendarPosition(null)
    }
  }, [isOpen, activeField, mounted])

  // Close calendar on outside click
  useEffect(() => {
    // 🔴 ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ДИАГНОСТИКИ
    return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // КРИТИЧНО: Не блокируем клики на Link элементы Next.js
      // Проверяем, что это не ссылка или элемент внутри ссылки
      if (target.closest('a[href]')) {
        return // Позволяем Next.js обработать клик на ссылку
      }
      
      if (
        calendarRef.current && 
        !calendarRef.current.contains(target) &&
        !checkInRef.current?.contains(target) &&
        !checkOutRef.current?.contains(target)
      ) {
        setIsOpen(false)
        setActiveField(null)
      }
    }

    if (isOpen) {
      // Используем 'click' вместо 'mousedown', чтобы не мешать Next.js router
      // НЕ используем capture phase, чтобы Next.js Link успел обработать клик первым
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Check if date is in range
  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false
    const dateStr = formatDate(date)
    return dateStr > checkIn && dateStr < checkOut
  }

  // Check if date is start
  const isStart = (date: Date) => {
    const dateStr = formatDate(date)
    return dateStr === checkIn
  }

  // Check if date is end
  const isEnd = (date: Date) => {
    const dateStr = formatDate(date)
    return dateStr === checkOut
  }

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // Check if date is disabled
  const isDisabled = (date: Date) => {
    if (date < minDateObj) return true
    
    // If selecting check-out, disable dates before check-in
    if (activeField === 'checkOut' && checkIn) {
      const checkInDate = new Date(checkIn)
      checkInDate.setHours(0, 0, 0, 0)
      return date <= checkInDate
    }
    
    return false
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return

    const dateStr = formatDate(date)

    if (activeField === 'checkIn') {
      onCheckInChange(dateStr)
      // If check-out was selected and is now invalid, clear it
      if (checkOut && dateStr >= checkOut) {
        onCheckOutChange('')
      }
      setIsOpen(false)
      setActiveField(null)
    } else if (activeField === 'checkOut') {
      if (!checkIn || dateStr > checkIn) {
        onCheckOutChange(dateStr)
        setIsOpen(false)
        setActiveField(null)
      }
    }
  }

  // Handle field click
  const handleFieldClick = (field: 'checkIn' | 'checkOut') => {
    if (isOpen && activeField === field) {
      setIsOpen(false)
      setActiveField(null)
    } else {
      setActiveField(field)
      setIsOpen(true)
    }
  }

  // Handle hover
  const handleDateHover = (date: Date | null) => {
    if (date) {
      setHoverDate(formatDate(date))
    } else {
      setHoverDate(null)
    }
  }

  // Get date classes
  const getDateClasses = (date: Date) => {
    const dateStr = formatDate(date)
    const isToday = dateStr === formatDate(today)
    const isDisabledDate = isDisabled(date)
    const isStartDate = isStart(date)
    const isEndDate = isEnd(date)
    const isInRangeDate = isInRange(date)

    let classes = 'w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer '

    if (isDisabledDate) {
      classes += 'text-gray-300 cursor-not-allowed '
    } else if (isStartDate || isEndDate) {
      classes += 'bg-primary text-white hover:bg-primary-dark '
    } else if (isInRangeDate) {
      classes += 'bg-blue-100 text-primary hover:bg-blue-200 '
    } else if (isToday) {
      classes += 'border-2 border-primary text-primary hover:bg-blue-50 '
    } else {
      classes += 'text-gray-700 hover:bg-gray-100 '
    }

    return classes
  }

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // Get next month
  const getNextMonth = () => {
    const next = new Date(currentMonth)
    next.setMonth(next.getMonth() + 1)
    return next
  }

  // Format display date
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  const renderCalendarContent = () => (
    <>
      {/* Mobile: single month compact, Desktop: two months */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {/* First month */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <div className="w-10 md:hidden" /> {/* Spacer for mobile */}
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1 md:mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[10px] md:text-xs font-medium text-gray-500 py-1.5 md:py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 md:gap-1">
            {getDaysInMonth(currentMonth).map((date, index) => (
              <div key={index} className="flex items-center justify-center">
                {date ? (
                  <button
                    type="button"
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => handleDateHover(date)}
                    onMouseLeave={() => handleDateHover(null)}
                    className={getDateClasses(date).replace('w-10 h-10', 'w-9 h-9 md:w-10 md:h-10')}
                    disabled={isDisabled(date)}
                  >
                    <span className="text-xs md:text-sm">{date.getDate()}</span>
                  </button>
                ) : (
                  <div className="w-9 h-9 md:w-10 md:h-10" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Second month - desktop only */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10" /> {/* Spacer */}
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[getNextMonth().getMonth()]} {getNextMonth().getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(getNextMonth()).map((date, index) => (
              <div key={index} className="flex items-center justify-center">
                {date ? (
                  <button
                    type="button"
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => handleDateHover(date)}
                    onMouseLeave={() => handleDateHover(null)}
                    className={getDateClasses(date)}
                    disabled={isDisabled(date)}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <div className="w-10 h-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info text */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs md:text-sm text-gray-500 text-center">
        {activeField === 'checkIn' 
          ? 'Выберите дату заезда' 
          : checkIn 
            ? 'Выберите дату выезда (после заезда)'
            : 'Сначала выберите дату заезда'}
      </div>
      
      {/* Close button for mobile */}
      <div className="md:hidden mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setActiveField(null)
          }}
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors font-semibold text-base shadow-md active:scale-95"
        >
          Закрыть
        </button>
      </div>
    </>
  )

  return (
    <div className={`relative ${className}`}>
      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        Даты
      </label>
      {/* Mobile: строго вертикальный layout без перекрытий, Desktop: горизонтальный */}
      <div className="flex flex-col sm:flex-row gap-2 sm:h-[48px]">
        <div className="flex-1 min-w-0 w-full">
          <button
            ref={checkInRef}
            type="button"
            onClick={() => handleFieldClick('checkIn')}
            className={`w-full min-h-[44px] sm:h-full px-3 sm:px-4 py-2.5 sm:py-0 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-left bg-white hover:border-gray-300 text-xs sm:text-sm flex items-center ${
              activeField === 'checkIn' ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
            }`}
          >
            {checkIn ? formatDisplayDate(checkIn) : 'Заезд'}
          </button>
        </div>
        <div className="flex-1 min-w-0 w-full">
          <button
            ref={checkOutRef}
            type="button"
            onClick={() => handleFieldClick('checkOut')}
            disabled={!checkIn}
            className={`w-full min-h-[44px] sm:h-full px-3 sm:px-4 py-2.5 sm:py-0 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-left bg-white hover:border-gray-300 text-xs sm:text-sm flex items-center ${
              !checkIn ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
            } ${
              activeField === 'checkOut' ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
            }`}
          >
            {checkOut ? formatDisplayDate(checkOut) : 'Выезд'}
          </button>
        </div>
      </div>

      {isOpen && activeField && (
        <>
          {/* Mobile overlay */}
          {mounted && typeof window !== 'undefined' && window.innerWidth < 768 && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1040] cursor-pointer"
              onClick={() => {
                setIsOpen(false)
                setActiveField(null)
              }}
            />
          )}
          {mounted && typeof window !== 'undefined' && calendarPosition && (
            createPortal(
              window.innerWidth >= 768 ? (
                // Desktop calendar
                <div
                  ref={calendarRef}
                  className="fixed z-[1050] bg-white border border-gray-200 rounded-xl shadow-xl p-6 max-w-[700px] min-w-[600px]"
                  style={{
                    top: `${calendarPosition.top}px`,
                    left: `${calendarPosition.left}px`,
                    maxWidth: 'calc(100vw - 16px)'
                  }}
                >
                  {renderCalendarContent()}
                </div>
              ) : (
                // Mobile calendar - всегда fixed bottom: 0 через Portal в body
                <div
                  ref={calendarRef}
                  className="fixed z-[1050] bg-white border-t border-gray-200 rounded-t-3xl shadow-2xl p-4 pb-4 left-0 right-0 max-h-[60vh] overflow-y-auto bottom-0"
                  style={{ 
                    maxWidth: '100vw',
                    width: '100%',
                    bottom: 0
                  }}
                >
                  {/* Handle */}
                  <div className="flex justify-center mb-4 pb-2 border-b border-gray-100 flex-shrink-0">
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                  </div>
                  {renderCalendarContent()}
                </div>
              ),
              document.body
            )
          )}
        </>
      )}
    </div>
  )
}
