import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Listing } from '../../listings/entities/listing.entity'
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity'
import { Review } from '../../reviews/entities/review.entity'
import { SearchSession } from '../entities/search-session.entity'
import { UserPreference } from '../entities/user-preference.entity'

/**
 * Scoring Engine - умная система ранжирования объявлений LOCUS
 * 
 * Вычисляет итоговый score объявления на основе множества факторов:
 * - Цена относительно похожих объявлений
 * - Частота бронирований
 * - Рейтинг и отзывы
 * - Полнота карточки
 * - Актуальность
 * - Доверие (проверенный хозяин, качество объявления)
 * - Соответствие предпочтениям пользователя
 */
@Injectable()
export class ScoringEngineService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>
  ) {}

  /**
   * Вычисление итогового score для объявления LOCUS
   */
  async calculateScore(
    listing: Listing,
    searchParams?: {
      checkIn?: string
      checkOut?: string
      tripPurpose?: 'work' | 'leisure' | 'urgent'
      priceRange?: { min?: number; max?: number }
      priorities?: {
        quiet?: number
        center?: number
        comfort?: number
        price?: number
      }
      city?: string
      coordinates?: { lat: number; lng: number; radius?: number }
    },
    userPreferences?: UserPreference['preferences']
  ): Promise<number> {
    const factors = await this.calculateFactors(listing, searchParams, userPreferences)

    // Взвешенная сумма факторов
    const weights = {
      price: 0.20,
      location: 0.20,
      rating: 0.20,
      completeness: 0.15,
      trust: 0.15,
      preferences: 0.10,
    }

    const totalScore =
      factors.priceScore * weights.price +
      factors.locationScore * weights.location +
      factors.ratingScore * weights.rating +
      factors.completenessScore * weights.completeness +
      factors.trustScore * weights.trust +
      factors.preferencesScore * weights.preferences

    // Нормализация к диапазону 0-1
    return Math.max(0, Math.min(1, totalScore))
  }

  /**
   * Вычисление всех факторов
   */
  async calculateFactors(
    listing: Listing,
    searchParams?: {
      checkIn?: string
      checkOut?: string
      tripPurpose?: 'work' | 'leisure' | 'urgent'
      priceRange?: { min?: number; max?: number }
      priorities?: {
        quiet?: number
        center?: number
        comfort?: number
        price?: number
      }
      city?: string
      coordinates?: { lat: number; lng: number; radius?: number }
    },
    userPreferences?: UserPreference['preferences']
  ) {
    return {
      // Фактор цены (0-1, где 1 - лучшая цена)
      priceScore: await this.calculatePriceScore(listing, searchParams),

      // Фактор локации (0-1)
      locationScore: this.calculateLocationScore(listing, searchParams),

      // Фактор рейтинга (0-1)
      ratingScore: this.calculateRatingScore(listing),

      // Фактор полноты карточки (0-1)
      completenessScore: this.calculateCompletenessScore(listing),

      // Фактор доверия (0-1)
      trustScore: await this.calculateTrustScore(listing),

      // Фактор соответствия предпочтениям (0-1)
      preferencesScore: this.calculatePreferencesScore(listing, userPreferences, searchParams),
    }
  }

  /**
   * Оценка цены относительно похожих объявлений LOCUS
   */
  private async calculatePriceScore(
    listing: Listing,
    searchParams?: any
  ): Promise<number> {
    // Сравниваем с похожими объявлениями в том же городе
    const similarListings = await this.listingsRepository
      .createQueryBuilder('l')
      .where('l.city = :city', { city: listing.city })
      .andWhere('l.type = :type', { type: listing.type })
      .andWhere('l.status = :status', { status: 'active' })
      .andWhere('l.id != :id', { id: listing.id })
      .getMany()

    if (similarListings.length === 0) {
      return 0.5 // Нейтральная оценка если нет похожих
    }

    const avgPrice =
      similarListings.reduce((sum, l) => sum + Number(l.pricePerNight), 0) /
      similarListings.length

    const price = Number(listing.pricePerNight)
    const deviation = (price - avgPrice) / avgPrice

    // Чем ниже цена относительно среднего, тем выше score
    // -30% = 1.0, 0% = 0.5, +30% = 0.0
    return Math.max(0, Math.min(1, 0.5 - deviation * 1.5))
  }

  /**
   * Оценка локации
   */
  private calculateLocationScore(listing: Listing, searchParams?: any): number {
    if (!searchParams?.coordinates) {
      return 0.5 // Нейтральная оценка если нет точки интереса
    }

    const { lat, lng, radius = 10 } = searchParams.coordinates
    const distance = this.calculateDistance(
      lat,
      lng,
      Number(listing.latitude),
      Number(listing.longitude)
    )

    // Чем ближе к точке интереса, тем выше score
    const normalizedDistance = Math.min(1, distance / radius)
    return 1 - normalizedDistance
  }

  /**
   * Оценка рейтинга
   */
  private calculateRatingScore(listing: Listing): number {
    if (!listing.rating) {
      return 0.3 // Низкий score если нет рейтинга
    }

    // Нормализация рейтинга 0-5 к 0-1
    const ratingScore = Number(listing.rating) / 5

    // Учитываем количество отзывов
    const reviewsWeight = Math.min(1, (listing.reviewsCount || 0) / 10) // 10+ отзывов = полный вес

    return ratingScore * (0.5 + 0.5 * reviewsWeight)
  }

  /**
   * Оценка полноты карточки
   */
  private calculateCompletenessScore(listing: Listing): number {
    let score = 0
    let maxScore = 0

    // Наличие фото
    maxScore += 1
    score += listing.images && listing.images.length > 0 ? 1 : 0

    // Наличие описания
    maxScore += 1
    score += listing.description && listing.description.length > 50 ? 1 : 0

    // Наличие координат
    maxScore += 1
    score += listing.latitude && listing.longitude ? 1 : 0

    // Наличие удобств
    maxScore += 1
    score += listing.amenities && listing.amenities.length > 0 ? 1 : 0

    // Наличие рейтинга
    maxScore += 1
    score += listing.rating !== null ? 1 : 0

    // Наличие адреса
    maxScore += 1
    score += listing.address ? 1 : 0

    return maxScore > 0 ? score / maxScore : 0
  }

  /**
   * Оценка доверия к объявлению
   */
  private async calculateTrustScore(listing: Listing): Promise<number> {
    let score = 0.5 // Базовый уровень

    // Проверенный хозяин (можно добавить поле isVerified в User)
    // Пока используем количество успешных бронирований как индикатор
    const successfulBookings = await this.bookingsRepository.count({
      where: {
        listing: { id: listing.id },
        status: BookingStatus.COMPLETED,
      },
    })

    if (successfulBookings > 10) {
      score += 0.2 // Высокое доверие
    } else if (successfulBookings > 5) {
      score += 0.1 // Среднее доверие
    }

    // Качество объявления (полнота данных)
    const completeness = this.calculateCompletenessScore(listing)
    score += completeness * 0.2

    // Рейтинг влияет на доверие
    if (listing.rating && listing.rating >= 4.5) {
      score += 0.1
    }

    return Math.min(1, score)
  }

  /**
   * Оценка соответствия предпочтениям пользователя
   */
  private calculatePreferencesScore(
    listing: Listing,
    userPreferences?: UserPreference['preferences'],
    searchParams?: any
  ): number {
    if (!userPreferences && !searchParams?.priorities) {
      return 0.5 // Нейтральная оценка если нет предпочтений
    }

    const priorities = userPreferences?.priorities || searchParams?.priorities || {}
    let score = 0
    let weightSum = 0

    // Приоритет тишины
    if (priorities.quiet) {
      // TODO: Использовать данные о районе, удаленности от дорог
      const quietScore = 0.5 // Заглушка
      score += quietScore * priorities.quiet
      weightSum += priorities.quiet
    }

    // Приоритет центра
    if (priorities.center) {
      const centerScore = this.estimateCenterProximity(listing, searchParams)
      score += centerScore * priorities.center
      weightSum += priorities.center
    }

    // Приоритет комфорта
    if (priorities.comfort) {
      const comfortScore = this.estimateComfort(listing)
      score += comfortScore * priorities.comfort
      weightSum += priorities.comfort
    }

    // Приоритет цены
    if (priorities.price) {
      const priceScore = this.estimatePriceValue(listing, userPreferences?.budgetRange)
      score += priceScore * priorities.price
      weightSum += priorities.price
    }

    return weightSum > 0 ? score / weightSum : 0.5
  }

  /**
   * Оценка близости к центру
   */
  private estimateCenterProximity(listing: Listing, searchParams?: any): number {
    // TODO: Использовать реальные данные о центре города
    // Пока используем координаты из поиска как "центр"
    if (searchParams?.coordinates) {
      const distance = this.calculateDistance(
        searchParams.coordinates.lat,
        searchParams.coordinates.lng,
        Number(listing.latitude),
        Number(listing.longitude)
      )
      return Math.max(0, 1 - distance / 10) // Чем ближе, тем лучше
    }
    return 0.5
  }

  /**
   * Оценка комфорта
   */
  private estimateComfort(listing: Listing): number {
    let score = 0
    const amenities = listing.amenities || []

    // Наличие важных удобств
    const importantAmenities = ['wifi', 'kitchen', 'parking', 'air_conditioning']
    const hasImportant = importantAmenities.filter((a) => amenities.includes(a)).length
    score += (hasImportant / importantAmenities.length) * 0.5

    // Рейтинг влияет на комфорт
    if (listing.rating) {
      score += (Number(listing.rating) / 5) * 0.5
    }

    return Math.min(1, score)
  }

  /**
   * Оценка ценности по цене
   */
  private estimatePriceValue(
    listing: Listing,
    budgetRange?: { min?: number; max?: number }
  ): number {
    if (!budgetRange) {
      return 0.5
    }

    const price = Number(listing.pricePerNight)
    const { min, max } = budgetRange

    if (min && price < min) {
      return 0.3 // Ниже минимального бюджета
    }
    if (max && price > max) {
      return 0.0 // Выше максимального бюджета
    }

    // В пределах бюджета - чем ближе к минимуму, тем лучше
    if (min && max) {
      const range = max - min
      const position = (price - min) / range
      return 1 - position * 0.5 // От 1.0 до 0.5
    }

    return 0.7
  }

  /**
   * Расчет расстояния между двумя точками (формула гаверсинуса)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Радиус Земли в км
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  /**
   * Получение объяснения рекомендации
   */
  async getExplanation(
    listing: Listing,
    score: number,
    factors: any
  ): Promise<{
    primaryReason: string
    factors: Array<{ name: string; score: number; description: string }>
  }> {
    // Определение главной причины
    const factorScores = [
      { name: 'price', score: factors.priceScore },
      { name: 'location', score: factors.locationScore },
      { name: 'rating', score: factors.ratingScore },
      { name: 'trust', score: factors.trustScore },
    ]

    const topFactor = factorScores.reduce((a, b) => (a.score > b.score ? a : b))

    const reasons: Record<string, string> = {
      price: 'Отличное соотношение цена/качество',
      location: 'Удобное расположение',
      rating: 'Высокий рейтинг и положительные отзывы',
      trust: 'Проверенный хозяин и надёжное объявление',
    }

    return {
      primaryReason: reasons[topFactor.name] || 'Хороший вариант',
      factors: [
        {
          name: 'Цена',
          score: factors.priceScore,
          description: this.getPriceDescription(factors.priceScore),
        },
        {
          name: 'Локация',
          score: factors.locationScore,
          description: this.getLocationDescription(factors.locationScore),
        },
        {
          name: 'Рейтинг',
          score: factors.ratingScore,
          description: this.getRatingDescription(listing),
        },
        {
          name: 'Доверие',
          score: factors.trustScore,
          description: this.getTrustDescription(factors.trustScore),
        },
      ],
    }
  }

  private getPriceDescription(score: number): string {
    if (score > 0.7) return 'Отличная цена относительно рынка'
    if (score > 0.5) return 'Средняя цена на рынке'
    return 'Цена выше среднерыночной'
  }

  private getLocationDescription(score: number): string {
    if (score > 0.7) return 'Очень удобное расположение'
    if (score > 0.5) return 'Удобное расположение'
    return 'Расположение может быть неудобным'
  }

  private getRatingDescription(listing: Listing): string {
    if (!listing.rating) return 'Нет рейтинга'
    if (listing.rating >= 4.5) return `Отличный рейтинг ${listing.rating.toFixed(1)}`
    if (listing.rating >= 4.0) return `Хороший рейтинг ${listing.rating.toFixed(1)}`
    return `Рейтинг ${listing.rating.toFixed(1)}`
  }

  private getTrustDescription(score: number): string {
    if (score > 0.8) return 'Высокий уровень доверия'
    if (score > 0.6) return 'Средний уровень доверия'
    return 'Низкий уровень доверия'
  }
}
