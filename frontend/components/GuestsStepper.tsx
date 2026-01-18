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
    <div className={`${className} w-full`}>
      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
        <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="whitespace-nowrap">Гостей</span>
      </label>
      <div className="flex items-center gap-2 sm:gap-3 border border-gray-200 rounded-lg px-2 sm:px-3 bg-white w-full" style={{ display: 'flex', alignItems: 'center', height: '44px', minHeight: '44px' }}>
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isMinDisabled}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center ${
            isMinDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
          }`}
          aria-label="Уменьшить количество гостей"
          style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Minus className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
        </button>
        <div className="flex-1 text-center min-w-0 flex items-center justify-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            {value}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline ml-1.5" style={{ fontSize: '12px' }}>
            {value === 1 ? 'гость' : value < 5 ? 'гостя' : 'гостей'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={isMaxDisabled}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center ${
            isMaxDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
          }`}
          aria-label="Увеличить количество гостей"
          style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  )
}
