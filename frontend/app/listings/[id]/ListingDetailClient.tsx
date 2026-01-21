'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { listingsAPI, bookingsAPI, reviewsAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { 
  MapPin, Star, Users, Bed, Bath, Calendar, 
  Wifi, Car, UtensilsCrossed, Wind, Tv, 
  Home, ArrowLeft, Heart, Share2, Loader2, Eye, 
  ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, X
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/Toast'
import Breadcrumbs from '@/components/Breadcrumbs'
import Tooltip from '@/components/Tooltip'
import DateRangePicker from '@/components/DateRangePicker'
import GuestsStepper from '@/components/GuestsStepper'
import { normalizeImageSrc, sanitizeImages } from '@/lib/imageUtils'

// Lazy load MapView
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function ListingDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({})
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const { user } = useAuthStore()

  // Fix hydration error - mount check
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && params.id) {
      loadListing()
      loadReviews()
      checkCanReview()
    }
  }, [params.id, mounted, isAuthenticated, user])

  // КРИТИЧНО: Защита от накрутки просмотров - инкремент только один раз на сессию
  useEffect(() => {
    if (!mounted || !params.id || !listing?.id) return
    if (typeof window === 'undefined') return
    
    const viewedKey = `locus_viewed_${listing.id}`
    const hasViewed = sessionStorage.getItem(viewedKey)
    if (!hasViewed) {
      sessionStorage.setItem(viewedKey, 'true')
      // Backend сам инкрементирует views при запросе findOne, нам не нужно вызывать отдельно
    }
  }, [mounted, params.id, listing?.id])

  const loadListing = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!params.id || typeof params.id !== 'string') {
        setError('Неверный ID объявления')
        setListing(null)
        return
      }
      
      const response = await listingsAPI.getOne(params.id)
      
      // КРИТИЧНО: Обрабатываем разные форматы ответа с жёсткими проверками
      let listingData: any = null
      
      if (response?.data) {
        if (typeof response.data === 'object' && response.data !== null) {
          // Формат: { data: { ... } }
          if ('data' in response.data && response.data.data) {
            listingData = response.data.data
          } 
          // Формат: { ... } напрямую
          else if ('id' in response.data && 'title' in response.data) {
            listingData = response.data
          }
        }
      }
      
      // КРИТИЧНО: Проверяем что listingData валиден
      if (!listingData || typeof listingData !== 'object' || !listingData.id || typeof listingData.id !== 'string') {
        setError('Объявление не найдено')
        setListing(null)
        setLoading(false)
        return
      }
      
      // КРИТИЧНО: Санитизируем images перед сохранением в state - ВСЕГДА массив
      const sanitizedListing = {
        ...listingData,
        // Гарантируем что images всегда массив
        images: Array.isArray(listingData.images) 
          ? sanitizeImages(listingData.images) 
          : [],
        // Гарантируем что title всегда строка
        title: typeof listingData.title === 'string' && listingData.title.trim()
          ? listingData.title.trim()
          : 'Объявление без названия',
        // Гарантируем что description всегда строка
        description: typeof listingData.description === 'string'
          ? listingData.description
          : '',
        // Гарантируем что pricePerNight всегда число
        pricePerNight: typeof listingData.pricePerNight === 'number' && !isNaN(listingData.pricePerNight) && listingData.pricePerNight >= 0
          ? listingData.pricePerNight
          : (typeof listingData.price === 'number' && !isNaN(listingData.price) && listingData.price >= 0)
            ? listingData.price
            : 0,
        // Гарантируем что owner всегда объект или null
        owner: (listingData.owner && typeof listingData.owner === 'object') ? listingData.owner : null,
      }
      
      setListing(sanitizedListing)
    } catch (error: any) {
      console.error('Error loading listing:', error)
      const errorMessage = error?.response?.data?.message || error?.userMessage || error?.message || 'Объявление не найдено'
      setError(errorMessage)
      setListing(null)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      if (!params.id || typeof params.id !== 'string') {
        setReviews([])
        return
      }
      
      setReviewsLoading(true)
      const response = await reviewsAPI.getByListing(params.id)
      
      // КРИТИЧНО: Валидация reviews - всегда массив
      let reviewsData: any[] = []
      if (response?.data) {
        if (Array.isArray(response.data)) {
          reviewsData = response.data.filter((review: any) => review && typeof review === 'object' && review.id)
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          reviewsData = response.data.data.filter((review: any) => review && typeof review === 'object' && review.id)
        }
      }
      
      setReviews(reviewsData)
    } catch (error: any) {
      console.error('Error loading reviews:', error)
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  const checkCanReview = async () => {
    if (!isAuthenticated || !user || !params.id) {
      setCanReview(false)
      return
    }
    try {
      // Проверяем, есть ли бронирование у пользователя для этого объявления
      const bookingsResponse = await bookingsAPI.getAll()
      const bookings = Array.isArray(bookingsResponse.data) 
        ? bookingsResponse.data 
        : bookingsResponse.data?.data || []
      
      const hasBooking = bookings.some((booking: any) => 
        booking.listingId === params.id && 
        booking.userId === user.id &&
        booking.status === 'confirmed'
      )

      // Проверяем, не оставил ли уже отзыв
      const reviewsResponse = await reviewsAPI.getByListing(params.id as string)
      const existingReviews = Array.isArray(reviewsResponse.data) 
        ? reviewsResponse.data 
        : reviewsResponse.data?.data || []
      
      const hasReview = existingReviews.some((review: any) => review.userId === user.id)

      setCanReview(hasBooking && !hasReview)
    } catch (error: any) {
      console.error('Error checking can review:', error)
      setCanReview(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast('Выберите рейтинг от 1 до 5', 'warning')
      return
    }

    try {
      setReviewSubmitting(true)
      await reviewsAPI.create({
        listingId: params.id as string,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      })
      toast('Отзыв успешно добавлен!', 'success')
      setReviewRating(5)
      setReviewComment('')
      setShowReviewForm(false)
      setCanReview(false)
      loadReviews()
      loadListing() // Обновляем рейтинг объявления
    } catch (error: any) {
      toast(error.response?.data?.message || 'Ошибка при добавлении отзыва', 'error')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleBooking = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      setError('Выберите даты заезда и выезда')
      return
    }

    setBookingLoading(true)
    setError('')

    try {
      if (!listing?.id) {
        setError('Ошибка: объявление не найдено')
        return
      }
      
      await bookingsAPI.create({
        listingId: listing.id,
        checkIn: bookingDates.checkIn,
        checkOut: bookingDates.checkOut,
        guests: bookingDates.guests,
      })
      toast('Бронирование успешно создано!', 'success')
      router.push('/profile')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка создания бронирования'
      setError(errorMessage)
      toast(errorMessage, 'error')
    } finally {
      setBookingLoading(false)
    }
  }

  const amenitiesIcons: Record<string, any> = {
    wifi: Wifi,
    parking: Car,
    kitchen: UtensilsCrossed,
    airConditioning: Wind,
    tv: Tv,
  }


  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Загрузка объявления...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Объявление не найдено</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <Link href="/" className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // КРИТИЧНО: Ранние guards - защита от битых данных
  if (!listing || typeof listing !== 'object') {
    return (
      <div className="min-h-screen bg-white">
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Объявление не найдено
            </h2>
            <p className="text-gray-600 mb-8">
              К сожалению, запрашиваемое объявление не существует или было удалено.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Home className="w-5 h-5" />
              На главную
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // КРИТИЧНО: безопасная работа с images через useMemo - ВСЕГДА массив, никогда null/undefined
  const images = useMemo(() => {
    if (!listing || typeof listing !== 'object') return []
    if (!Array.isArray(listing.images)) return []
    return sanitizeImages(listing.images)
  }, [listing?.images])

  // КРИТИЧНО: безопасные значения с fallback - ВСЕГДА валидные строки/числа
  const safeTitle = (listing && typeof listing === 'object' && listing.title && typeof listing.title === 'string' && listing.title.trim())
    ? listing.title.trim()
    : 'Объявление'
    
  const safeDescription = (listing && typeof listing === 'object' && listing.description && typeof listing.description === 'string')
    ? listing.description.trim()
    : ''
    
  const safeAddress = (listing && typeof listing === 'object')
    ? (listing.address && typeof listing.address === 'string' && listing.address.trim()
        ? listing.address.trim()
        : (listing.city && typeof listing.city === 'string' && listing.city.trim()
            ? listing.city.trim()
            : 'Адрес не указан'))
    : 'Адрес не указан'
    
  const safeOwner = (listing && typeof listing === 'object' && listing.owner && typeof listing.owner === 'object')
    ? listing.owner
    : null
  
  // Безопасное получение цены
  const price = (listing?.pricePerNight != null && !isNaN(Number(listing.pricePerNight))) 
    ? Number(listing.pricePerNight) 
    : (listing?.price != null && !isNaN(Number(listing.price))) 
      ? Number(listing.price) 
      : 0
  
  // Безопасное получение просмотров
  const views = (listing?.views != null && !isNaN(Number(listing.views))) 
    ? Number(listing.views) 
    : (listing?.viewCount != null && !isNaN(Number(listing.viewCount))) 
      ? Number(listing.viewCount) 
      : 0

  // Gallery scroll handler
  const scrollGallery = (direction: 'left' | 'right') => {
    if (!galleryRef.current) return
    const scrollAmount = galleryRef.current.clientWidth
    galleryRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  // Handle image load
  const handleImageLoad = (index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }))
  }

  // Handle image error
  const handleImageError = (index: number) => {
    setImageLoading(prev => ({ ...prev, [index]: false }))
    setImageErrors(prev => ({ ...prev, [index]: true }))
  }

  // Keyboard navigation for fullscreen gallery - только после mounted
  useEffect(() => {
    // 🔴 ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ДИАГНОСТИКИ
    return

    if (!mounted || !isFullscreen || !listing || images.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false)
      } else if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1)
      } else if (e.key === 'ArrowRight' && currentImageIndex < images.length - 1) {
        setCurrentImageIndex(prev => prev + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mounted, isFullscreen, currentImageIndex, listing, images.length])

  // Update current image index when clicking on gallery images - только после mounted
  useEffect(() => {
    if (!mounted || !galleryRef.current || !listing || images.length === 0) return

    const handleScroll = () => {
      if (!galleryRef.current) return
      const scrollLeft = galleryRef.current.scrollLeft
      const imageWidth = galleryRef.current.clientWidth
      const newIndex = Math.round(scrollLeft / imageWidth)
      if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < images.length) {
        setCurrentImageIndex(newIndex)
      }
    }
    galleryRef.current.addEventListener('scroll', handleScroll)
    return () => {
      if (galleryRef.current) {
        galleryRef.current.removeEventListener('scroll', handleScroll)
      }
    }
  }, [mounted, currentImageIndex, listing, images.length])

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumbs
            items={[
              { label: 'Поиск', href: '/' },
              { label: safeTitle }
            ]}
          />
        </div>

        {/* Image Gallery */}
        <div className="container mx-auto px-4 py-4 sm:py-6">
          {images.length > 0 ? (
            <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100">
              {/* Main Gallery - Horizontal Scroll on Mobile, Grid on Desktop */}
              <div
                ref={galleryRef}
                className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 md:gap-2 h-[300px] sm:h-[400px] md:h-[500px] scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {Array.isArray(images) && images.length > 0 && images.map((image: string, index: number) => {
                  // КРИТИЧНО: валидация каждого image перед рендером
                  if (!image || typeof image !== 'string') return null
                  
                  const src = normalizeImageSrc(image)
                  const hasImage = src !== '/placeholder-image.svg'
                  // imageLoading по умолчанию пустой объект {}, поэтому проверяем явно
                  const isLoading = imageLoading[index] === undefined || imageLoading[index] === true
                  const hasError = imageErrors[index] === true
                  
                  return (
                    <div
                      key={`image-${index}-${String(src).slice(0, 20)}`}
                      className="relative flex-shrink-0 w-full md:w-auto snap-center md:snap-none cursor-pointer group"
                      onClick={() => {
                        if (mounted && index >= 0 && index < images.length && images[index]) {
                          setCurrentImageIndex(index)
                          setIsFullscreen(true)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && mounted && index >= 0 && index < images.length && images[index]) {
                          e.preventDefault()
                          setCurrentImageIndex(index)
                          setIsFullscreen(true)
                        }
                      }}
                    >
                      <div className="relative w-full h-full">
                        {/* Skeleton Loader */}
                        {isLoading && hasImage && !hasError && (
                          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
                        )}
                        
                        {/* Image or Fallback */}
                        {hasImage && !hasError ? (
                          <>
                            {isLoading && (
                              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 z-0" />
                            )}
                            <img
                              src={src}
                              alt={`${safeTitle} - фото ${index + 1}`}
                              className="w-full h-full object-cover transition-opacity duration-300"
                              loading="lazy"
                              decoding="async"
                              onLoad={() => {
                                handleImageLoad(index)
                                setImageLoading(prev => ({ ...prev, [index]: false }))
                              }}
                              onError={(e) => {
                                handleImageError(index)
                                console.error('Image load error:', src)
                                ;(e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'
                              }}
                            />
                            {/* Fullscreen Icon on Hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Maximize2 className="w-8 h-8 text-white" />
                            </div>
                          </>
                        ) : (
                          <img
                            src="/placeholder-image.svg"
                            alt="Фото скоро появится"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Navigation Arrows - Desktop Only */}
                  {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollGallery('left')}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors z-10 cursor-pointer"
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollGallery('right')}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors z-10 cursor-pointer"
                    aria-label="Следующее фото"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-900" />
                  </button>
                </>
              )}
              
              {/* Photo Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-medium z-10">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="text-center px-4">
                <ImageIcon className="w-24 h-24 mx-auto mb-3 opacity-50 text-gray-400" />
                <p className="text-base font-medium text-gray-500">Фото скоро появится</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Fullscreen Gallery Modal - только после mounted */}
        {mounted && isFullscreen && Array.isArray(images) && images.length > 0 && (
          <div
            className="fixed inset-0 bg-black z-[1050] flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 text-white p-3 hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
            
            {currentImageIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex(prev => Math.max(0, prev - 1))
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            {currentImageIndex < images.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex(prev => Math.min(images.length - 1, prev + 1))
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            
            <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {(() => {
                // КРИТИЧНО: защита от выхода за границы массива - жёсткие проверки
                if (!mounted) return null
                if (!images || !Array.isArray(images) || images.length === 0) {
                  return (
                    <div className="text-white text-center p-8">
                      <ImageIcon className="w-24 h-24 mx-auto mb-3 opacity-50" />
                      <p>Фото не найдено</p>
                    </div>
                  )
                }
                if (currentImageIndex < 0 || currentImageIndex >= images.length) {
                  // Корректируем индекс если вышли за границы
                  const safeIndex = Math.max(0, Math.min(currentImageIndex, images.length - 1))
                  setCurrentImageIndex(safeIndex)
                  return null
                }
                
                const current = images[currentImageIndex]
                if (!current || typeof current !== 'string') {
                  return (
                    <div className="text-white text-center p-8">
                      <ImageIcon className="w-24 h-24 mx-auto mb-3 opacity-50" />
                      <p>Ошибка загрузки фото</p>
                    </div>
                  )
                }
                
                const src = normalizeImageSrc(current)
                const hasError = imageErrors[currentImageIndex] === true
                
                return src !== '/placeholder-image.svg' && !hasError ? (
                  <img
                    src={src}
                    alt={`${safeTitle} - фото ${currentImageIndex + 1}`}
                    className="max-w-full max-h-[90vh] object-contain"
                    onError={(e) => {
                      handleImageError(currentImageIndex)
                      ;(e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'
                    }}
                  />
                ) : (
                  <div className="text-white text-center p-8">
                    <ImageIcon className="w-24 h-24 mx-auto mb-3 opacity-50" />
                    <p>Фото не загружается</p>
                  </div>
                )
              })()}
            </div>
            
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm font-medium z-10">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        )}

        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {safeTitle}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {listing?.rating != null && !isNaN(Number(listing.rating)) && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">{Number(listing.rating).toFixed(1)}</span>
                        {listing?.reviewsCount != null && Number(listing.reviewsCount) > 0 && (
                          <span className="text-sm text-gray-600">
                            ({listing.reviewsCount} {listing.reviewsCount === 1 ? 'отзыв' : listing.reviewsCount < 5 ? 'отзыва' : 'отзывов'})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-600 px-3 py-1.5 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{safeAddress}</span>
                    </div>
                    {views > 0 && (
                      <div className="flex items-center gap-1.5 text-gray-600 px-3 py-1.5 bg-gray-50 rounded-lg">
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base">{views} {views === 1 ? 'просмотр' : views < 5 ? 'просмотра' : 'просмотров'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Описание</h2>
                  {safeDescription.length > 0 ? (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                      {safeDescription}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">Описание скоро появится</p>
                  )}
                </div>

                {/* Features */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Удобства</h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* КРИТИЧНО: все проверки с валидацией типов */}
                    {listing && typeof listing === 'object' && listing.maxGuests != null && !isNaN(Number(listing.maxGuests)) && Number(listing.maxGuests) > 0 && (
                      <div className="flex items-center gap-2.5 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition-colors">
                        <Users className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700">До {Number(listing.maxGuests)} {Number(listing.maxGuests) === 1 ? 'гостя' : 'гостей'}</span>
                      </div>
                    )}
                    {listing && typeof listing === 'object' && listing.bedrooms != null && !isNaN(Number(listing.bedrooms)) && Number(listing.bedrooms) > 0 && (
                      <div className="flex items-center gap-2.5 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition-colors">
                        <Bed className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700">{Number(listing.bedrooms)} {Number(listing.bedrooms) === 1 ? 'спальня' : Number(listing.bedrooms) < 5 ? 'спальни' : 'спален'}</span>
                      </div>
                    )}
                    {listing && typeof listing === 'object' && listing.beds != null && !isNaN(Number(listing.beds)) && Number(listing.beds) > 0 && (
                      <div className="flex items-center gap-2.5 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition-colors">
                        <Bed className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700">{Number(listing.beds)} {Number(listing.beds) === 1 ? 'кровать' : Number(listing.beds) < 5 ? 'кровати' : 'кроватей'}</span>
                      </div>
                    )}
                    {listing && typeof listing === 'object' && listing.bathrooms != null && !isNaN(Number(listing.bathrooms)) && Number(listing.bathrooms) > 0 && (
                      <div className="flex items-center gap-2.5 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition-colors">
                        <Bath className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700">{Number(listing.bathrooms)} {Number(listing.bathrooms) === 1 ? 'ванная' : Number(listing.bathrooms) < 5 ? 'ванные' : 'ванных'}</span>
                      </div>
                    )}
                    {listing && typeof listing === 'object' && listing.amenities && Array.isArray(listing.amenities) && listing.amenities.length > 0 && listing.amenities
                      .filter((amenity: any) => amenity != null && typeof amenity === 'string' && amenity.trim().length > 0)
                      .map((amenity: string, amenityIndex: number) => {
                        const Icon = amenitiesIcons[amenity.toLowerCase()]
                        if (!Icon) return null
                        return (
                          <div key={`amenity-${amenityIndex}-${String(amenity)}`} className="flex items-center gap-2.5 p-3 bg-white rounded-lg border border-gray-200 hover:border-primary transition-colors">
                            <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                            <span className="text-sm sm:text-base text-gray-700 capitalize">{String(amenity)}</span>
                          </div>
                        )
                      })}
                  </div>
                  {(!listing || typeof listing !== 'object' || 
                    (!listing.maxGuests || Number(listing.maxGuests) === 0) &&
                    (!listing.bedrooms || Number(listing.bedrooms) === 0) &&
                    (!listing.beds || Number(listing.beds) === 0) &&
                    (!listing.bathrooms || Number(listing.bathrooms) === 0) &&
                    (!listing.amenities || !Array.isArray(listing.amenities) || listing.amenities.length === 0)) && (
                    <p className="text-gray-500 italic text-center py-4">Информация об удобствах скоро появится</p>
                  )}
                </div>

                {/* Map */}
                {listing && typeof listing === 'object' && 
                 listing.latitude != null && listing.longitude != null && 
                 !isNaN(Number(listing.latitude)) && !isNaN(Number(listing.longitude)) && 
                 Number(listing.latitude) >= -90 && Number(listing.latitude) <= 90 &&
                 Number(listing.longitude) >= -180 && Number(listing.longitude) <= 180 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Местоположение</h2>
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <MapView listings={[listing]} />
                    </div>
                  </div>
                )}

                {/* Reviews */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Отзывы</h2>
                    {canReview && (
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="btn btn-sm btn-primary cursor-pointer"
                      >
                        {showReviewForm ? 'Отмена' : 'Оставить отзыв'}
                      </button>
                    )}
                  </div>

                  {/* Форма добавления отзыва */}
                  {showReviewForm && canReview && (
                    <div className="bg-white rounded-xl p-6 border-2 border-primary/20 mb-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Ваш отзыв</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Рейтинг <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setReviewRating(rating)}
                                className={`p-2 rounded-lg transition-colors ${
                                  reviewRating >= rating
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                <Star className={`w-6 h-6 ${reviewRating >= rating ? 'fill-current' : ''}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Комментарий
                          </label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Расскажите о вашем опыте..."
                            className="input w-full h-32 resize-none"
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleSubmitReview}
                            disabled={reviewSubmitting}
                            className="btn btn-primary cursor-pointer disabled:cursor-not-allowed"
                          >
                            {reviewSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Отправка...
                              </>
                            ) : (
                              'Отправить отзыв'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowReviewForm(false)
                              setReviewComment('')
                              setReviewRating(5)
                            }}
                            className="btn btn-secondary cursor-pointer"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : reviews && Array.isArray(reviews) && reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review: any, index: number) => {
                        // КРИТИЧНО: валидация review перед рендером
                        if (!review || typeof review !== 'object' || !review.id || typeof review.id !== 'string') {
                          return null
                        }
                        
                        // Безопасные значения для review
                        const safeRating = (review.rating != null && !isNaN(Number(review.rating)) && Number(review.rating) >= 1 && Number(review.rating) <= 5)
                          ? Number(review.rating)
                          : null
                        const safeUserName = (review?.user?.firstName && typeof review.user.firstName === 'string')
                          ? review.user.firstName.trim()
                          : (review?.userName && typeof review.userName === 'string')
                            ? review.userName.trim()
                            : 'Анонимный пользователь'
                        const safeComment = (review?.comment && typeof review.comment === 'string' && review.comment.trim().length > 0)
                          ? review.comment.trim()
                          : ''
                        const safeDate = review?.createdAt
                          ? (() => {
                              try {
                                const date = new Date(review.createdAt)
                                if (!isNaN(date.getTime())) {
                                  return date.toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })
                                }
                              } catch {}
                              return ''
                            })()
                          : ''
                        
                        return (
                          <div key={`review-${review.id}-${index}`} className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-primary font-semibold">
                                    {safeUserName[0]?.toUpperCase() || 'А'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-900 block">
                                    {safeUserName}
                                  </span>
                                  {safeRating && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs text-gray-600">{safeRating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {safeDate && (
                                <span className="text-xs sm:text-sm text-gray-500">
                                  {safeDate}
                                </span>
                              )}
                            </div>
                            {safeComment ? (
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{safeComment}</p>
                            ) : (
                              <p className="text-gray-500 italic text-sm">Отзыв без текста</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 sm:p-12 border border-gray-200 text-center">
                      <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-1">Отзывов пока нет</p>
                      <p className="text-sm text-gray-500">
                        {canReview 
                          ? 'Будьте первым, кто оставит отзыв!' 
                          : 'Отзывы могут оставлять только гости после бронирования'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Sidebar - улучшенный дизайн */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-white border-2 border-primary/20 rounded-2xl p-5 sm:p-6 shadow-xl">
                  {/* Price - выделенный блок */}
                  <div className="mb-6 pb-6 border-b-2 border-gray-200">
                    <div className="flex items-baseline gap-2 mb-2">
                      <div className="text-3xl sm:text-4xl font-bold text-primary">
                        {price.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                    <div className="text-base text-gray-600 font-semibold">за ночь</div>
                  </div>

                  {/* Booking Form */}
                  <div className="space-y-4 mb-6">
                    <DateRangePicker
                      checkIn={bookingDates.checkIn}
                      checkOut={bookingDates.checkOut}
                      onCheckInChange={(date) => setBookingDates({ ...bookingDates, checkIn: date })}
                      onCheckOutChange={(date) => setBookingDates({ ...bookingDates, checkOut: date })}
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                    
                    <GuestsStepper
                      value={bookingDates.guests}
                      onChange={(value) => setBookingDates({ ...bookingDates, guests: value })}
                      min={1}
                      max={listing && typeof listing === 'object' && listing.maxGuests != null && !isNaN(Number(listing.maxGuests)) && Number(listing.maxGuests) > 0 
                        ? Number(listing.maxGuests) 
                        : 20}
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="w-full bg-primary text-white py-4 rounded-lg hover:bg-primary-dark transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Бронирование...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5" />
                        Забронировать
                      </>
                    )}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-sm text-gray-600 text-center mt-4">
                      <Link href="/login" className="text-primary hover:text-primary-dark">
                        Войдите
                      </Link>
                      {' '}для бронирования
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
