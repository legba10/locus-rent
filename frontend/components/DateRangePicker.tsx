'use client'

import { useState, useEffect, useRef } from 'react'
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
  const calendarRef = useRef<HTMLDivElement>(null)
  const checkInRef = useRef<HTMLButtonElement>(null)
  const checkOutRef = useRef<HTMLButtonElement>(null)

  const today = new Date()
  const minDateObj = minDate ? new Date(minDate) : today
  minDateObj.setHours(0, 0, 0, 0)

  // Close calendar on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
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
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
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

  return (
    <div className={`relative ${className}`}>
      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        Даты
      </label>
      <div className="flex flex-col sm:flex-row gap-2 h-[44px] sm:h-[48px]">
        <div className="flex-1 min-w-0">
          <button
            ref={checkInRef}
            type="button"
            onClick={() => handleFieldClick('checkIn')}
            className={`w-full h-full px-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-left bg-white hover:border-gray-300 text-xs sm:text-sm ${
              activeField === 'checkIn' ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
            }`}
          >
            {checkIn ? formatDisplayDate(checkIn) : 'Заезд'}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <button
            ref={checkOutRef}
            type="button"
            onClick={() => handleFieldClick('checkOut')}
            disabled={!checkIn}
            className={`w-full h-full px-3 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-left bg-white hover:border-gray-300 text-xs sm:text-sm ${
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
          <div 
            className="fixed inset-0 bg-black/20 z-[9998] md:hidden"
            onClick={() => {
              setIsOpen(false)
              setActiveField(null)
            }}
          />
        <div
          ref={calendarRef}
          className="fixed md:absolute z-[9999] md:mt-2 bg-white border border-gray-200 rounded-t-2xl md:rounded-xl shadow-xl p-4 md:p-6 max-w-[95vw] md:max-w-[700px] md:min-w-[600px] bottom-0 left-0 right-0 md:bottom-auto md:left-0 md:right-auto md:top-full"
        >
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
          <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setActiveField(null)
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors font-medium text-sm"
            >
              Закрыть
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
