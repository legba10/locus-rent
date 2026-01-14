'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Users, DollarSign, Sparkles, Loader2 } from 'lucide-react'
import { recommendationAPI, citiesAPI } from '@/lib/api'
import { toast } from './Toast'

interface SmartNavigatorProps {
  onResults: (results: any) => void
}

type PriorityLevel = 'high' | 'medium' | 'low'

export default function SmartNavigator({ onResults }: SmartNavigatorProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tripPurpose: 'leisure' as 'work' | 'leisure' | 'urgent',
    checkIn: '',
    checkOut: '',
    budget: { min: undefined, max: undefined },
    priorities: {
      quiet: 'medium' as PriorityLevel,
      center: 'medium' as PriorityLevel,
      comfort: 'medium' as PriorityLevel,
      price: 'medium' as PriorityLevel,
    },
    city: '',
    coordinates: undefined as { lat: number; lng: number; radius?: number } | undefined,
  })
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSubmit = async () => {
    if (!formData.city) {
      toast('Укажите город для поиска', 'warning')
      return
    }
    if (!formData.checkIn || !formData.checkOut) {
      toast('Укажите даты заезда и выезда', 'warning')
      return
    }
    
    setLoading(true)
    try {
      const weights: Record<PriorityLevel, number> = {
        high: 1,
        medium: 0.5,
        low: 0,
      }

      const numericPriorities: Record<string, number> = Object.fromEntries(
        Object.entries(formData.priorities).map(([key, value]) => [key, weights[value as PriorityLevel]])
      )

      const response = await recommendationAPI.smartSearch({
        ...formData,
        priorities: numericPriorities,
        checkIn: new Date(formData.checkIn).toISOString(),
        checkOut: new Date(formData.checkOut).toISOString(),
      })
      onResults(response.data)
      toast('Поиск завершён! Найден лучший вариант для вас', 'success')
    } catch (error: any) {
      console.error('Smart search error:', error)
      toast(
        error.response?.data?.message || 'Ошибка поиска. Попробуйте снова.',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Умный подбор жилья</h2>
          <p className="text-text-secondary text-sm">
            LOCUS найдёт лучший вариант для вас
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Шаг {step === 1 ? 1 : step === 2 ? 2 : step === 2.5 ? 3 : step === 3 ? 4 : 5} из 5
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(((step === 1 ? 1 : step === 2 ? 2 : step === 2.5 ? 3 : step === 3 ? 4 : 5) / 5) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${((step === 1 ? 1 : step === 2 ? 2 : step === 2.5 ? 3 : step === 3 ? 4 : 5) / 5) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Step 1: Цель поездки */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Цель поездки</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'work', label: 'Работа', icon: '💼' },
              { value: 'leisure', label: 'Отдых', icon: '🏖️' },
              { value: 'urgent', label: 'Срочно', icon: '⚡' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setFormData({ ...formData, tripPurpose: option.value as any })
                  setStep(2)
                }}
                className={`p-6 rounded-lg border-2 transition-all ${
                  formData.tripPurpose === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-4xl mb-2">{option.icon}</div>
                <div className="font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Даты */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Даты пребывания</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                <Calendar className="w-4 h-4" />
                Заезд
              </label>
              <input
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                Выезд
              </label>
              <input
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min={formData.checkIn || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
            <button
              onClick={() => setStep(2.5)}
              disabled={!formData.checkIn || !formData.checkOut}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              Далее
            </button>
          </div>
        </div>
      )}

      {/* Step 2.5: Город */}
      {step === 2.5 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Где ищете?</h3>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Город
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={async (e) => {
                const value = e.target.value
                setFormData({ ...formData, city: value })
                if (value.length >= 2) {
                  try {
                    const response = await citiesAPI.search(value, 5)
                    setCitySuggestions(response.data || [])
                    setShowSuggestions(true)
                  } catch (error) {
                    console.error('City search error:', error)
                  }
                } else {
                  setCitySuggestions([])
                  setShowSuggestions(false)
                }
              }}
              onFocus={() => {
                if (citySuggestions.length > 0) setShowSuggestions(true)
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200)
              }}
              placeholder="Москва, Санкт-Петербург..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {citySuggestions.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, city: city.name })
                      setShowSuggestions(false)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{city.name}</span>
                    {city.region && (
                      <span className="text-sm text-gray-500">({city.region})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.city}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              Далее
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Бюджет */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Бюджет (руб/ночь)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">От</label>
              <input
                type="number"
                placeholder="1000"
                value={formData.budget.min || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: { ...formData.budget, min: parseInt(e.target.value) || undefined },
                  })
                }
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">До</label>
              <input
                type="number"
                placeholder="5000"
                value={formData.budget.max || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: { ...formData.budget, max: parseInt(e.target.value) || undefined },
                  })
                }
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(2.5)}
              className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors ml-auto"
            >
              Далее
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Приоритеты */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Что для вас важно?</h3>
          <p className="text-sm text-text-secondary mb-2">
            Для каждого параметра выберите, насколько он важен. Мы подберём варианты в соответствии с вашим выбором.
          </p>
          
          {[
            { key: 'quiet', label: 'Тишина', icon: '🔇' },
            { key: 'center', label: 'Центр города', icon: '📍' },
            { key: 'comfort', label: 'Комфорт', icon: '⭐' },
            { key: 'price', label: 'Низкая цена', icon: '💰' },
          ].map((priority) => (
            <div key={priority.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{priority.icon}</span>
                  <span>{priority.label}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'high' as PriorityLevel, label: 'Очень важно' },
                  { value: 'medium' as PriorityLevel, label: 'Желательно' },
                  { value: 'low' as PriorityLevel, label: 'Не важно' },
                ].map((option) => {
                  const isActive =
                    formData.priorities[priority.key as keyof typeof formData.priorities] === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          priorities: {
                            ...formData.priorities,
                            [priority.key]: option.value,
                          },
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-xs md:text-sm border transition-all ${
                        isActive
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary/60'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Поиск...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Найти лучший вариант
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
