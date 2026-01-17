'use client'

import { useState } from 'react'
import { Users, Minus, Plus } from 'lucide-react'

interface GuestsStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export default function GuestsStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  className = '',
}: GuestsStepperProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const isMinDisabled = value <= min
  const isMaxDisabled = value >= max

  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        <Users className="w-4 h-4 text-gray-500" />
        Гостей
      </label>
      <div className="flex items-center justify-between gap-2 sm:gap-3 border border-gray-200 rounded-lg px-2 sm:px-3 bg-white h-[44px] sm:h-[48px]">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isMinDisabled}
          className={`p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0 flex items-center justify-center ${
            isMinDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-primary active:scale-95'
          }`}
          aria-label="Уменьшить количество гостей"
        >
          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div className="flex-1 text-center min-w-0 flex items-center justify-center">
          <span className="text-base sm:text-lg font-semibold text-gray-900">
            {value}
          </span>
          <span className="text-xs sm:text-sm text-gray-500 ml-1 hidden sm:inline">
            {value === 1 ? 'гость' : value < 5 ? 'гостя' : 'гостей'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={isMaxDisabled}
          className={`p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0 flex items-center justify-center ${
            isMaxDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-primary active:scale-95'
          }`}
          aria-label="Увеличить количество гостей"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  )
}
