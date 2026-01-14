import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Listing } from '../listings/entities/listing.entity'
import { Booking } from '../bookings/entities/booking.entity'
import { ScoringEngineService } from './scoring/scoring-engine.service'
import { TrustService } from './trust/trust.service'
import { SearchSession } from './entities/search-session.entity'
import { Recommendation } from './entities/recommendation.entity'
import { UserPreference } from './entities/user-preference.entity'

/**
 * Recommendation Engine - умная система рекомендаций для LOCUS
 * 
 * Анализирует собственные объявления LOCUS и рекомендует лучшие варианты
 * на основе параметров пользователя, истории бронирований и других факторов.
 */
@Injectable()
export class RecommendationEngineService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private scoringEngine: ScoringEngineService,
    private trustService: TrustService,
    @InjectRepository(SearchSession)
    private searchSessionsRepository: Repository<SearchSession>,
    @InjectRepository(Recommendation)
    private recommendationsRepository: Repository<Recommendation>,
    @InjectRepository(UserPreference)
    private userPreferencesRepository: Repository<UserPreference>
  ) {}

  /**
   * Поиск и ранжирование объявлений LOCUS
   */
  async findRecommendations(params: {
    city?: string
    checkIn?: Date
    checkOut?: Date
    guests?: number
    priceRange?: { min?: number; max?: number }
    coordinates?: { lat: number; lng: number; radius?: number }
    tripPurpose?: 'work' | 'leisure' | 'urgent'
    priorities?: {
      quiet?: number
      center?: number
      comfort?: number
      price?: number
    }
    userId?: string
    limit?: number
  }): Promise<Listing[]> {
    // Базовый запрос активных объявлений
    const query = this.listingsRepository.createQueryBuilder('listing')
      .leftJoinAndSelect('listing.owner', 'owner')
      .leftJoinAndSelect('listing.reviews', 'reviews')
      .leftJoinAndSelect('listing.bookings', 'bookings')
      .where('listing.status = :status', { status: 'active' })

    // Фильтры
    if (params.city) {
      query.andWhere('listing.city ILIKE :city', { city: `%${params.city}%` })
    }

    if (params.coordinates) {
      const { lat, lng, radius = 10 } = params.coordinates
      query.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(listing.latitude)) * 
        cos(radians(listing.longitude) - radians(:lng)) + 
        sin(radians(:lat)) * sin(radians(listing.latitude)))) <= :radius`,
        { lat, lng, radius }
      )
    }

    if (params.priceRange) {
      if (params.priceRange.min) {
        query.andWhere('listing.pricePerNight >= :minPrice', { minPrice: params.priceRange.min })
      }
      if (params.priceRange.max) {
        query.andWhere('listing.pricePerNight <= :maxPrice', { maxPrice: params.priceRange.max })
      }
    }

    if (params.guests) {
      query.andWhere('listing.maxGuests >= :guests', { guests: params.guests })
    }

    // Проверка доступности дат
    if (params.checkIn && params.checkOut) {
      query.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM bookings b 
          WHERE b.listingId = listing.id 
          AND b.status IN ('pending', 'confirmed')
          AND b.checkIn <= :checkOut 
          AND b.checkOut >= :checkIn
        )`,
        { checkIn: params.checkIn, checkOut: params.checkOut }
      )
    }

    const listings = await query.getMany()

    // Фильтрация слабых вариантов через Trust Service
    const filteredListings = []
    for (const listing of listings) {
      const shouldHide = await this.trustService.shouldHideFromRecommendations(listing)
      if (!shouldHide) {
        filteredListings.push(listing)
      }
    }

    // Получение предпочтений пользователя
    let userPreferences: UserPreference['preferences'] | undefined
    if (params.userId) {
      const pref = await this.userPreferencesRepository.findOne({
        where: { userId: params.userId },
      })
      userPreferences = pref?.preferences
    }

    // Вычисление scores для всех объявлений
    const scoredListings = await Promise.all(
      filteredListings.map(async (listing) => {
        const score = await this.scoringEngine.calculateScore(
          listing,
          {
            checkIn: params.checkIn?.toISOString(),
            checkOut: params.checkOut?.toISOString(),
            tripPurpose: params.tripPurpose,
            priceRange: params.priceRange,
            priorities: params.priorities,
            city: params.city,
            coordinates: params.coordinates,
          },
          userPreferences
        )

        return { listing, score }
      })
    )

    // Сортировка по score и фильтрация слабых вариантов
    const filtered = scoredListings
      .filter((item) => item.score >= 0.3) // Минимальный порог
      .sort((a, b) => b.score - a.score)

    // Применение лимита
    const limit = params.limit || 10
    return filtered.slice(0, limit).map((item) => item.listing)
  }

  /**
   * Получение лучшего варианта (главная рекомендация)
   */
  async getBestMatch(params: {
    city?: string
    checkIn?: Date
    checkOut?: Date
    guests?: number
    priceRange?: { min?: number; max?: number }
    coordinates?: { lat: number; lng: number; radius?: number }
    tripPurpose?: 'work' | 'leisure' | 'urgent'
    priorities?: {
      quiet?: number
      center?: number
      comfort?: number
      price?: number
    }
    userId?: string
  }): Promise<{
    listing: Listing | null
    score: number
    explanation: {
      primaryReason: string
      factors: Array<{ name: string; score: number; description: string }>
    }
  }> {
    const recommendations = await this.findRecommendations({ ...params, limit: 1 })

    if (recommendations.length === 0) {
      return {
        listing: null,
        score: 0,
        explanation: {
          primaryReason: 'Подходящих вариантов не найдено',
          factors: [],
        },
      }
    }

    const listing = recommendations[0]

    // Получение предпочтений для объяснения
    let userPreferences: UserPreference['preferences'] | undefined
    if (params.userId) {
      const pref = await this.userPreferencesRepository.findOne({
        where: { userId: params.userId },
      })
      userPreferences = pref?.preferences
    }

    const factors = await this.scoringEngine.calculateFactors(
      listing,
      {
        checkIn: params.checkIn?.toISOString(),
        checkOut: params.checkOut?.toISOString(),
        tripPurpose: params.tripPurpose,
        priceRange: params.priceRange,
        priorities: params.priorities,
        city: params.city,
        coordinates: params.coordinates,
      },
      userPreferences
    )

    const score = await this.scoringEngine.calculateScore(
      listing,
      {
        checkIn: params.checkIn?.toISOString(),
        checkOut: params.checkOut?.toISOString(),
        tripPurpose: params.tripPurpose,
        priceRange: params.priceRange,
        priorities: params.priorities,
        city: params.city,
        coordinates: params.coordinates,
      },
      userPreferences
    )

    const explanation = await this.scoringEngine.getExplanation(listing, score, factors)

    return {
      listing,
      score,
      explanation,
    }
  }

  /**
   * Получение альтернативных вариантов (2-3 штуки)
   */
  async getAlternatives(params: {
    excludeListingId: string
    city?: string
    checkIn?: Date
    checkOut?: Date
    guests?: number
    priceRange?: { min?: number; max?: number }
    coordinates?: { lat: number; lng: number; radius?: number }
    tripPurpose?: 'work' | 'leisure' | 'urgent'
    priorities?: {
      quiet?: number
      center?: number
      comfort?: number
      price?: number
    }
    userId?: string
    limit?: number
  }): Promise<Listing[]> {
    const query = this.listingsRepository.createQueryBuilder('listing')
      .leftJoinAndSelect('listing.owner', 'owner')
      .where('listing.status = :status', { status: 'active' })
      .andWhere('listing.id != :excludeId', { excludeId: params.excludeListingId })

    // Применяем те же фильтры, что и для основного поиска
    if (params.city) {
      query.andWhere('listing.city ILIKE :city', { city: `%${params.city}%` })
    }

    if (params.coordinates) {
      const { lat, lng, radius = 10 } = params.coordinates
      query.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(listing.latitude)) * 
        cos(radians(listing.longitude) - radians(:lng)) + 
        sin(radians(:lat)) * sin(radians(listing.latitude)))) <= :radius`,
        { lat, lng, radius }
      )
    }

    if (params.priceRange) {
      if (params.priceRange.min) {
        query.andWhere('listing.pricePerNight >= :minPrice', { minPrice: params.priceRange.min })
      }
      if (params.priceRange.max) {
        query.andWhere('listing.pricePerNight <= :maxPrice', { maxPrice: params.priceRange.max })
      }
    }

    if (params.guests) {
      query.andWhere('listing.maxGuests >= :guests', { guests: params.guests })
    }

    const listings = await query.limit(params.limit || 3).getMany()

    // Ранжирование альтернатив
    let userPreferences: UserPreference['preferences'] | undefined
    if (params.userId) {
      const pref = await this.userPreferencesRepository.findOne({
        where: { userId: params.userId },
      })
      userPreferences = pref?.preferences
    }

    const scored = await Promise.all(
      listings.map(async (listing) => {
        const score = await this.scoringEngine.calculateScore(
          listing,
          {
            checkIn: params.checkIn?.toISOString(),
            checkOut: params.checkOut?.toISOString(),
            tripPurpose: params.tripPurpose,
            priceRange: params.priceRange,
            priorities: params.priorities,
            city: params.city,
            coordinates: params.coordinates,
          },
          userPreferences
        )
        return { listing, score }
      })
    )

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, params.limit || 3)
      .map((item) => item.listing)
  }
}
