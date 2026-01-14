/**
 * Единая внутренняя модель объявления
 * Все объявления из разных источников приводятся к этому формату
 */
export interface UnifiedListing {
  // Идентификация
  internalId: string
  source: ListingSource
  externalId: string | null

  // Основная информация
  housingType: HousingType
  title: string
  description: string
  address: Address
  coordinates: Coordinates

  // Цены (нормализованные в рублях за сутки)
  pricePerDay: number
  pricePerWeek?: number
  pricePerMonth?: number
  currency: string // 'RUB' по умолчанию

  // Рейтинг и отзывы
  rating: number | null // 0-5
  reviewsCount: number

  // Медиа
  photos: Photo[]
  thumbnail?: string

  // Условия
  conditions: Conditions
  availabilityCalendar: AvailabilityCalendar

  // Метаданные
  trustScore: number // 0-1, вычисляется Scoring Engine
  lastUpdatedAt: Date
  createdAt: Date

  // Дополнительные данные (для расширения)
  metadata?: Record<string, any>
}

export enum ListingSource {
  LOCUS = 'locus',
  AVITO = 'avito',
  SUTOCHNO = 'sutochno',
  CIAN = 'cian',
  XML_FEED = 'xml_feed',
  JSON_FEED = 'json_feed',
}

export enum HousingType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  STUDIO = 'studio',
  ROOM = 'room',
  COTTAGE = 'cottage',
  LOFT = 'loft',
}

export interface Address {
  city: string
  district?: string
  street?: string
  houseNumber?: string
  fullAddress: string
  postalCode?: string
}

export interface Coordinates {
  lat: number
  lng: number
  accuracy?: number // точность в метрах
}

export interface Photo {
  url: string
  thumbnailUrl?: string
  description?: string
  order: number
}

export interface Conditions {
  maxGuests: number
  bedrooms?: number
  beds?: number
  bathrooms?: number
  area?: number // м²
  floor?: number
  totalFloors?: number
  amenities: string[] // ['wifi', 'parking', 'kitchen', ...]
  houseRules?: string[]
  checkInTime?: string // '14:00'
  checkOutTime?: string // '12:00'
  cancellationPolicy?: string
}

export interface AvailabilityCalendar {
  availableDates: Date[]
  blockedDates: Date[]
  minStay?: number // минимальное количество ночей
  maxStay?: number
}

/**
 * Результат нормализации
 */
export interface NormalizationResult {
  success: boolean
  unifiedListing?: UnifiedListing
  errors?: string[]
  warnings?: string[]
}
