import { Injectable } from '@nestjs/common'
import { UnifiedListing } from '../interfaces/unified-listing.interface'
import { SearchSession } from '../entities/search-session.entity'
import { UserPreference } from '../entities/user-preference.entity'

/**
 * Scoring Engine - умная система ранжирования объявлений
 * 
 * Вычисляет итоговый score объявления на основе множества факторов:
 * - Цена относительно рынка
 * - Расстояние до центра/точки интереса
 * - Рейтинг и отзывы
 * - Полнота карточки
 * - Актуальность
 * - Надёжность источника
 * - История бронирований
 * - Соответствие предпочтениям пользователя
 */
@Injectable()
export class ScoringEngineService {
  /**
   * Вычисление итогового score для объявления
   */
  async calculateScore(
    listing: UnifiedListing,
    searchParams?: SearchSession['searchParams'],
    userPreferences?: UserPreference['preferences']
  ): Promise<number> {
    const factors = await this.calculateFactors(listing, searchParams, userPreferences)

    // Взвешенная сумма факторов
    const weights = {
      price: 0.25,
      location: 0.20,
      rating: 0.15,
      completeness: 0.10,
      trust: 0.15,
      preferences: 0.15,
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
    listing: UnifiedListing,
    searchParams?: SearchSession['searchParams'],
    userPreferences?: UserPreference['preferences']
  ) {
    return {
      // Фактор цены (0-1, где 1 - лучшая цена)
      priceScore: this.calculatePriceScore(listing, searchParams),

      // Фактор локации (0-1)
      locationScore: this.calculateLocationScore(listing, searchParams),

      // Фактор рейтинга (0-1)
      ratingScore: this.calculateRatingScore(listing),

      // Фактор полноты карточки (0-1)
      completenessScore: this.calculateCompletenessScore(listing),

      // Фактор доверия (0-1)
      trustScore: listing.trustScore,

      // Фактор соответствия предпочтениям (0-1)
      preferencesScore: this.calculatePreferencesScore(listing, userPreferences),
    }
  }

  /**
   * Оценка цены относительно рынка
   */
  private calculatePriceScore(
    listing: UnifiedListing,
    searchParams?: SearchSession['searchParams']
  ): number {
    // TODO: Использовать реальные данные рынка для сравнения
    // Пока используем простую логику на основе диапазона цен из поиска

    if (!searchParams?.priceRange) {
      return 0.5 // Нейтральная оценка если нет данных о рынке
    }

    const { min, max } = searchParams.priceRange
    const price = listing.pricePerDay

    if (!min || !max) {
      return 0.5
    }

    const marketAverage = (min + max) / 2
    const deviation = (price - marketAverage) / marketAverage

    // Чем ниже цена относительно рынка, тем выше score
    // -50% = 1.0, 0% = 0.5, +50% = 0.0
    return Math.max(0, Math.min(1, 0.5 - deviation))
  }

  /**
   * Оценка локации
   */
  private calculateLocationScore(
    listing: UnifiedListing,
    searchParams?: SearchSession['searchParams']
  ): number {
    if (!searchParams?.coordinates) {
      return 0.5
    }

    const { lat, lng, radius = 10 } = searchParams.coordinates
    const distance = this.calculateDistance(
      lat,
      lng,
      listing.coordinates.lat,
      listing.coordinates.lng
    )

    // Чем ближе к точке интереса, тем выше score
    // 0 км = 1.0, radius/2 км = 0.5, radius км = 0.0
    const normalizedDistance = Math.min(1, distance / radius)
    return 1 - normalizedDistance
  }

  /**
   * Оценка рейтинга
   */
  private calculateRatingScore(listing: UnifiedListing): number {
    if (!listing.rating) {
      return 0.3 // Низкий score если нет рейтинга
    }

    // Нормализация рейтинга 0-5 к 0-1
    const ratingScore = listing.rating / 5

    // Учитываем количество отзывов
    const reviewsWeight = Math.min(1, listing.reviewsCount / 10) // 10+ отзывов = полный вес

    return ratingScore * (0.5 + 0.5 * reviewsWeight)
  }

  /**
   * Оценка полноты карточки
   */
  private calculateCompletenessScore(listing: UnifiedListing): number {
    let score = 0
    let maxScore = 0

    // Наличие фото
    maxScore += 1
    score += listing.photos.length > 0 ? 1 : 0

    // Наличие описания
    maxScore += 1
    score += listing.description.length > 50 ? 1 : 0

    // Наличие координат
    maxScore += 1
    score += listing.coordinates.lat && listing.coordinates.lng ? 1 : 0

    // Наличие условий
    maxScore += 1
    score += listing.conditions.amenities.length > 0 ? 1 : 0

    // Наличие рейтинга
    maxScore += 1
    score += listing.rating !== null ? 1 : 0

    return maxScore > 0 ? score / maxScore : 0
  }

  /**
   * Оценка соответствия предпочтениям пользователя
   */
  private calculatePreferencesScore(
    listing: UnifiedListing,
    preferences?: UserPreference['preferences']
  ): number {
    if (!preferences) {
      return 0.5 // Нейтральная оценка если нет предпочтений
    }

    let score = 0
    let weightSum = 0

    // Приоритет тишины
    if (preferences.priorities?.quiet) {
      const quietScore = this.estimateQuietness(listing)
      score += quietScore * preferences.priorities.quiet
      weightSum += preferences.priorities.quiet
    }

    // Приоритет центра
    if (preferences.priorities?.center) {
      const centerScore = this.estimateCenterProximity(listing)
      score += centerScore * preferences.priorities.center
      weightSum += preferences.priorities.center
    }

    // Приоритет комфорта
    if (preferences.priorities?.comfort) {
      const comfortScore = this.estimateComfort(listing)
      score += comfortScore * preferences.priorities.comfort
      weightSum += preferences.priorities.comfort
    }

    // Приоритет цены
    if (preferences.priorities?.price) {
      const priceScore = this.estimatePriceValue(listing, preferences.budgetRange)
      score += priceScore * preferences.priorities.price
      weightSum += preferences.priorities.price
    }

    return weightSum > 0 ? score / weightSum : 0.5
  }

  /**
   * Оценка тишины (заглушка)
   */
  private estimateQuietness(listing: UnifiedListing): number {
    // TODO: Использовать данные о районе, удаленности от дорог и т.д.
    return 0.5
  }

  /**
   * Оценка близости к центру (заглушка)
   */
  private estimateCenterProximity(listing: UnifiedListing): number {
    // TODO: Использовать реальные данные о центре города
    return 0.5
  }

  /**
   * Оценка комфорта
   */
  private estimateComfort(listing: UnifiedListing): number {
    let score = 0
    const amenities = listing.conditions.amenities || []

    // Наличие удобств повышает комфорт
    const importantAmenities = ['wifi', 'kitchen', 'parking', 'air_conditioning']
    const hasImportant = importantAmenities.filter(a => amenities.includes(a)).length
    score += hasImportant / importantAmenities.length * 0.5

    // Рейтинг влияет на комфорт
    if (listing.rating) {
      score += (listing.rating / 5) * 0.5
    }

    return Math.min(1, score)
  }

  /**
   * Оценка ценности по цене
   */
  private estimatePriceValue(
    listing: UnifiedListing,
    budgetRange?: { min?: number; max?: number }
  ): number {
    if (!budgetRange) {
      return 0.5
    }

    const price = listing.pricePerDay
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
    listing: UnifiedListing,
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
      trust: 'Проверенный источник',
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

  private getRatingDescription(listing: UnifiedListing): string {
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
