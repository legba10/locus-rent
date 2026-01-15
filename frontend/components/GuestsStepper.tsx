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
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        <Users className="w-4 h-4 text-gray-500" />
        Гостей
      </label>
      <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-2 py-1 bg-white">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isMinDisabled}
          className={`p-2 rounded-lg transition-all ${
            isMinDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-primary active:scale-95'
          }`}
          aria-label="Уменьшить количество гостей"
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-lg font-semibold text-gray-900 min-w-[2rem] inline-block">
            {value}
          </span>
          <span className="text-sm text-gray-500 ml-1">
            {value === 1 ? 'гость' : value < 5 ? 'гостя' : 'гостей'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={isMaxDisabled}
          className={`p-2 rounded-lg transition-all ${
            isMaxDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-primary active:scale-95'
          }`}
          aria-label="Увеличить количество гостей"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
