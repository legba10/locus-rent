'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { listingsAPI, citiesAPI } from '@/lib/api'
import { ArrowLeft, ArrowRight, Loader2, MapPin, Upload, CheckCircle2, FileText, Home, DollarSign, Sparkles, Camera, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/Toast'
import { useAuthStore } from '@/lib/store'
import Breadcrumbs from '@/components/Breadcrumbs'
import { ListingType, Listing } from '@/lib/types/listing'

const STEPS = [
  { id: 1, title: 'Основная информация', icon: FileText },
  { id: 2, title: 'Местоположение', icon: MapPin },
  { id: 3, title: 'Цена и вместимость', icon: DollarSign },
  { id: 4, title: 'Удобства', icon: Sparkles },
  { id: 5, title: 'Фотографии', icon: Camera },
  { id: 6, title: 'Проверка и публикация', icon: CheckCircle },
]

export default function NewListingStepperPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saveAsDraft, setSaveAsDraft] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'apartment',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    pricePerNight: '',
    maxGuests: '',
    bedrooms: '',
    beds: '',
    bathrooms: '',
    amenities: [] as string[],
  })
  const [images, setImages] = useState<string[]>([])
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [fileError, setFileError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)

  const DRAFT_STORAGE_KEY = 'locus_new_listing_draft'

  const amenitiesOptions = [
    { value: 'wifi', label: 'Wi-Fi', icon: '📶' },
    { value: 'kitchen', label: 'Кухня', icon: '🍳' },
    { value: 'parking', label: 'Парковка', icon: '🚗' },
    { value: 'airConditioning', label: 'Кондиционер', icon: '❄️' },
    { value: 'washingMachine', label: 'Стиральная машина', icon: '🌀' },
    { value: 'tv', label: 'Телевизор', icon: '📺' },
    { value: 'balcony', label: 'Балкон', icon: '🌆' },
    { value: 'elevator', label: 'Лифт', icon: '🛗' },
  ]

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!formData.title?.trim()) {
          newErrors.title = 'Название обязательно для заполнения'
        }
        if (!formData.description?.trim()) {
          newErrors.description = 'Описание обязательно для заполнения'
        }
        if (!formData.type) {
          newErrors.type = 'Выберите тип жилья'
        }
        break
      case 2:
        if (!formData.city?.trim()) {
          newErrors.city = 'Укажите город'
        }
        if (!formData.address?.trim()) {
          newErrors.address = 'Укажите адрес'
        }
        break
      case 3:
        if (!formData.pricePerNight || parseFloat(formData.pricePerNight) <= 0) {
          newErrors.pricePerNight = 'Укажите цену за ночь'
        }
        if (!formData.maxGuests || parseInt(formData.maxGuests) < 1) {
          newErrors.maxGuests = 'Укажите количество гостей'
        }
        break
      case 5:
        if (!saveAsDraft && images.length === 0) {
          newErrors.images = 'Для публикации нужно добавить хотя бы одну фотографию'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddImage = () => {
    const url = imageUrl.trim()
    if (!url) return
    if (images.length >= 10) {
      toast('Можно добавить не более 10 фотографий', 'warning')
      return
    }
    setImages((prev) => [...prev, url])
    setImageUrl('')
    setFileError('')
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    if (errors.images) {
      setErrors({ ...errors, images: '' })
    }
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = 10 - images.length
    if (remainingSlots <= 0) {
      setFileError('Можно добавить не более 10 фотографий')
      return
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots)
    filesToAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setFileError('Загружайте только изображения')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result
        if (typeof result === 'string') {
          setImages((prev) => {
            if (prev.length >= 10) return prev
            return [...prev, result]
          })
          setFileError('')
          if (errors.images) {
            setErrors({ ...errors, images: '' })
          }
        }
      }
      reader.onerror = () => {
        setFileError('Ошибка загрузки файла')
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleCityChange = async (value: string) => {
    handleChange('city', value)
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
  }

  const toggleAmenity = (amenity: string) => {
    const amenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter(a => a !== amenity)
      : [...formData.amenities, amenity]
    handleChange('amenities', amenities)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.type
      case 2:
        return formData.city && formData.address
      case 3:
        return formData.pricePerNight && formData.maxGuests
      case 4:
        return true // Удобства опциональны
      case 5:
        // Для черновика фото не обязательны, для публикации — минимум 1
        return saveAsDraft || images.length >= 1
      case 6:
        // На шаге проверки все обязательные поля уже валидированы
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast('Проверьте заполнение полей', 'warning')
      return
    }
    
    if (canProceed()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    } else {
      if (!saveAsDraft && currentStep === 5 && images.length === 0) {
        toast('Добавьте хотя бы одну фотографию или сохраните как черновик', 'warning')
      } else {
        toast('Заполните все обязательные поля', 'warning')
      }
    }
  }

  const handleSubmit = async () => {
    if (!saveAsDraft && images.length === 0) {
      setCurrentStep(5)
      toast('Для публикации добавьте хотя бы одну фотографию', 'warning')
      return
    }

    setLoading(true)
    try {
      // Валидация обязательных числовых полей
      const pricePerNight = parseFloat(formData.pricePerNight)
      const maxGuests = parseInt(formData.maxGuests)
      
      if (isNaN(pricePerNight) || pricePerNight <= 0) {
        toast('Укажите корректную цену за ночь', 'error')
        setCurrentStep(3)
        setLoading(false)
        return
      }
      
      if (isNaN(maxGuests) || maxGuests < 1) {
        toast('Укажите корректное количество гостей', 'error')
        setCurrentStep(3)
        setLoading(false)
        return
      }

      // Очищаем пустые строки и преобразуем в правильные типы
      const listingData: Partial<Listing> & { type: ListingType; status?: 'draft' | 'moderation' } = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type as ListingType,
        city: formData.city.trim(),
        address: formData.address.trim(),
        pricePerNight: pricePerNight,
        maxGuests: maxGuests,
        // Для черновика ставим draft, для публикации - не указываем (backend поставит moderation)
        ...(saveAsDraft ? { status: 'draft' } : {}),
      }

      // Изображения - для черновика можно без фото, для публикации обязательно
      if (images.length > 0) {
        listingData.images = images
      } else if (saveAsDraft) {
        // Для черновика можно отправить пустой массив или не отправлять вообще
        // Бэкенд должен принимать пустой массив для черновиков
        listingData.images = []
      }

      // Опциональные поля - только если заполнены
      if (formData.bedrooms && String(formData.bedrooms).trim()) {
        const bedrooms = parseInt(String(formData.bedrooms))
        if (!isNaN(bedrooms)) listingData.bedrooms = bedrooms
      }
      if (formData.beds && String(formData.beds).trim()) {
        const beds = parseInt(String(formData.beds))
        if (!isNaN(beds)) listingData.beds = beds
      }
      if (formData.bathrooms && String(formData.bathrooms).trim()) {
        const bathrooms = parseFloat(String(formData.bathrooms))
        if (!isNaN(bathrooms)) listingData.bathrooms = bathrooms
      }
      if (formData.latitude && String(formData.latitude).trim()) {
        const lat = parseFloat(String(formData.latitude))
        if (!isNaN(lat)) listingData.latitude = lat
      }
      if (formData.longitude && String(formData.longitude).trim()) {
        const lng = parseFloat(String(formData.longitude))
        if (!isNaN(lng)) listingData.longitude = lng
      }
      if (formData.amenities && formData.amenities.length > 0) {
        listingData.amenities = formData.amenities
      }

      console.log('Sending listing data:', JSON.stringify(listingData, null, 2))
      
      const response = await listingsAPI.create(listingData)
      console.log('Listing created successfully:', response.data)
      
      toast(
        saveAsDraft 
          ? 'Черновик сохранён' 
          : 'Объявление отправлено на модерацию. После проверки оно будет опубликовано.',
        'success'
      )

      // Очищаем черновик
      if (typeof window !== 'undefined') {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      }
      
      // Небольшая задержка перед редиректом для показа toast
      setTimeout(() => {
        router.push('/landlord')
      }, 500)
    } catch (err: any) {
      console.error('Listing creation error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      let errorMessage = 'Ошибка создания объявления. Проверьте данные и попробуйте снова.'
      
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data.error) {
          errorMessage = Array.isArray(err.response.data.error) 
            ? err.response.data.error.join(', ')
            : err.response.data.error
        } else if (Array.isArray(err.response.data)) {
          errorMessage = err.response.data.map((e: any) => e.message || e).join(', ')
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      toast(errorMessage, 'error')
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  // Восстановление черновика при загрузке
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?next=/landlord/listings/new-stepper')
      return
    }

    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft.formData) setFormData(draft.formData)
      if (draft.images) setImages(draft.images)
      if (draft.currentStep) setCurrentStep(draft.currentStep)
      if (typeof draft.saveAsDraft === 'boolean') setSaveAsDraft(draft.saveAsDraft)
    } catch (error) {
      console.error('Failed to restore listing draft:', error)
    }
  }, [])

  // Автосохранение черновика
  useEffect(() => {
    if (typeof window === 'undefined') return
    const draft = {
      formData,
      images,
      currentStep,
      saveAsDraft,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    } catch (error) {
      console.error('Failed to save listing draft:', error)
    }
  }, [formData, images, currentStep, saveAsDraft])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/30">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full">
          <Breadcrumbs
            items={[
              { label: 'Кабинет арендодателя', href: '/landlord' },
              { label: 'Создать объявление' }
            ]}
          />

          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Создать объявление</h1>
            <p className="text-sm sm:text-base text-gray-600">Пошаговое размещение вашего жилья</p>
          </div>

          {/* Progress Steps - Mobile: горизонтальный скролл, Desktop: горизонтально */}
          <div className="mb-4 sm:mb-6 md:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-between min-w-max sm:min-w-0 gap-2 sm:gap-0">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = currentStep > step.id
                const isActive = currentStep === step.id
                return (
                  <div key={step.id} className="flex items-center flex-shrink-0 sm:flex-1">
                    <div className="flex flex-col items-center sm:flex-1 min-w-[80px] sm:min-w-0">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                          isCompleted
                            ? 'bg-primary text-white shadow-lg scale-105'
                            : isActive
                            ? 'bg-primary text-white shadow-lg ring-2 sm:ring-4 ring-primary/20'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                        ) : (
                          <StepIcon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${isActive ? 'text-white' : ''}`} />
                        )}
                      </div>
                      <span
                        className={`mt-2 sm:mt-3 text-[10px] sm:text-xs font-medium text-center max-w-[80px] sm:max-w-[100px] truncate ${
                          isActive || isCompleted ? 'text-primary font-semibold' : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`hidden sm:block h-1 flex-1 mx-2 sm:mx-3 rounded transition-all flex-shrink-0 ${
                          isCompleted ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8 w-full">
            {/* Step 1: Основная информация */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Расскажите о жилье</h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  Опишите ваше жилье так, как рассказали бы другу. Что делает его особенным?
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base min-h-[44px] ${
                      errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Уютная квартира в центре"
                    required
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={6}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm sm:text-base ${
                      errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Опишите, что делает ваше жилье комфортным и привлекательным для гостей..."
                    required
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип жилья *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.type ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    required
                  >
                    <option value="">Выберите тип</option>
                    <option value="apartment">Квартира</option>
                    <option value="house">Дом</option>
                    <option value="studio">Студия</option>
                    <option value="apartment_complex">Апартаменты</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-xs text-red-600">{errors.type}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Местоположение */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Где находится жилье?</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Укажите город и точный адрес. Это поможет гостям найти ваше жилье.
                </p>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Город *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    onFocus={() => {
                      if (citySuggestions.length > 0) setShowSuggestions(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200)
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.city ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Москва"
                    required
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                  )}
                  {showSuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {citySuggestions.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            handleChange('city', city.name)
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Адрес *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.address ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    placeholder="ул. Примерная, д. 1"
                    required
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Цена и вместимость */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Цена и вместимость</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Укажите цену за ночь и сколько гостей может разместиться.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Цена за ночь (₽) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.pricePerNight}
                      onChange={(e) => handleChange('pricePerNight', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.pricePerNight ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                      placeholder="3000"
                      required
                    />
                    {errors.pricePerNight && (
                      <p className="mt-1 text-xs text-red-600">{errors.pricePerNight}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Максимум гостей *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxGuests}
                      onChange={(e) => handleChange('maxGuests', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.maxGuests ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                      }`}
                      placeholder="4"
                      required
                    />
                    {errors.maxGuests && (
                      <p className="mt-1 text-xs text-red-600">{errors.maxGuests}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Спальни
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => handleChange('bedrooms', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Кровати
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.beds}
                      onChange={(e) => handleChange('beds', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ванные комнаты
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) => handleChange('bathrooms', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Удобства */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Удобства</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {amenitiesOptions.map((amenity) => (
                    <button
                      key={amenity.value}
                      type="button"
                      onClick={() => toggleAmenity(amenity.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.amenities.includes(amenity.value)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{amenity.icon}</div>
                      <div className="text-sm font-medium">{amenity.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Фотографии */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Добавьте фотографии</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Фотографии помогают гостям понять, что их ждёт. Добавьте хотя бы одну для публикации, лучше — несколько.
                </p>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 space-y-4 transition-all ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : errors.images
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-shrink-0">
                      <Upload className={`w-10 h-10 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-gray-700 font-medium">
                        {isDragging ? 'Отпустите файлы здесь' : 'Перетащите фотографии сюда или выберите файлы'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Можно загрузить файлы или вставить URL. Для публикации нужно минимум одно фото, всего можно добавить до 10 фотографий.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            handleFileUpload(e.target.files)
                            e.target.value = '' // Сброс input для возможности повторной загрузки того же файла
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer file:mr-3 file:px-3 file:py-2 file:border-0 file:rounded-md file:bg-primary file:text-white file:text-sm file:cursor-pointer"
                        />
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddImage}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                        >
                          Добавить фото
                        </button>
                      </div>
                      {(fileError || errors.images) && (
                        <p className="text-xs text-red-600">{fileError || errors.images}</p>
                      )}
                      {images.length === 0 && !errors.images && (
                        <p className="text-xs text-gray-400">
                          Рекомендуется добавить хотя бы 3–5 фотографий: гости охотнее бронируют такие объявления.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group"
                      >
                        <img src={img} alt={`Фото ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Проверка и публикация */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Проверьте данные перед публикацией</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Всё выглядит правильно? Если нужно что-то изменить — вернитесь на нужный шаг. После публикации вы сможете редактировать объявление в любое время.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Основная информация */}
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Основная информация</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Название</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formData.title || 'Без названия'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Описание</p>
                        <p className="text-sm text-gray-700 line-clamp-4">
                          {formData.description || 'Описание ещё не заполнено'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-blue-100">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          {formData.type === 'apartment'
                            ? 'Квартира'
                            : formData.type === 'house'
                            ? 'Дом'
                            : formData.type === 'studio'
                            ? 'Студия'
                            : 'Апартаменты'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Местоположение */}
                  <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Местоположение</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Город</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formData.city || 'Город не указан'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Адрес</p>
                        <p className="text-sm text-gray-700">
                          {formData.address || 'Адрес не указан'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Цена и вместимость */}
                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Цена и вместимость</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Цена за ночь</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formData.pricePerNight ? `${parseInt(formData.pricePerNight).toLocaleString('ru-RU')} ₽` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Гостей</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formData.maxGuests || '—'}
                        </p>
                      </div>
                      {formData.bedrooms && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Спальни</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formData.bedrooms}
                          </p>
                        </div>
                      )}
                      {formData.beds && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Кровати</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formData.beds}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Удобства и фотографии */}
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Удобства</h3>
                    </div>
                    {formData.amenities.length === 0 ? (
                      <p className="text-sm text-gray-500">Удобства не выбраны — вы всегда можете добавить их позже.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {amenitiesOptions
                          .filter((opt) => formData.amenities.includes(opt.value))
                          .map((opt) => (
                            <span
                              key={opt.value}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-xs font-medium"
                            >
                              <span>{opt.icon}</span>
                              <span>{opt.label}</span>
                            </span>
                          ))}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-orange-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Camera className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-700">
                          Фотографий: <span className="font-semibold">{images.length}</span>
                        </p>
                      </div>
                      {images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {images.slice(0, 6).map((img, index) => (
                            <div
                              key={index}
                              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
                            >
                              <img 
                                src={img} 
                                alt={`Фото ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              {index === 5 && images.length > 6 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">
                                    +{images.length - 6}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">
                          Фотографии не добавлены
                        </p>
                      )}
                      {!saveAsDraft && images.length === 0 && (
                        <p className="mt-2 text-xs text-red-600">
                          Для публикации нужно добавить хотя бы одну фотографию
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Итоговое сообщение */}
                <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 text-sm flex gap-4 items-start shadow-sm">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2 text-base">
                      Всё готово к {saveAsDraft ? 'сохранению черновика' : 'публикации объявления'}
                    </p>
                    <p className="text-gray-700">
                      Нажмите кнопку ниже, чтобы завершить. Вы всегда сможете вернуться и изменить детали позже.
                    </p>
                  </div>
                </div>

                {/* Ошибка отправки */}
                {errors.submit && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{errors.submit}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                Назад
              </button>

              <div className="flex flex-col items-stretch sm:items-end gap-3">
                <label className="flex items-center justify-center sm:justify-end gap-2 text-xs sm:text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={saveAsDraft}
                    onChange={(e) => setSaveAsDraft(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Сохранить как черновик</span>
                </label>
                <button
                  onClick={handleNext}
                  disabled={loading || !canProceed()}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-white rounded-lg sm:rounded-xl hover:bg-primary-dark transition-all font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="hidden sm:inline">Сохранение...</span>
                      <span className="sm:hidden">Сохранение</span>
                    </>
                  ) : currentStep === STEPS.length ? (
                    saveAsDraft ? 'Сохранить черновик' : 'Опубликовать'
                  ) : (
                    <>
                      Далее
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
