import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AggregationEngineService } from './aggregation-engine.service'
import { ScoringEngineService } from './scoring/scoring-engine.service'
import { SearchSession } from './entities/search-session.entity'
import { Recommendation } from './entities/recommendation.entity'
import { UserPreference } from './entities/user-preference.entity'
import { UnifiedListing } from './interfaces/unified-listing.interface'

/**
 * Smart Navigator Service
 * Реализует логику "умного навигатора" - подбор лучших вариантов
 */
@Injectable()
export class SmartNavigatorService {
  constructor(
    private aggregationEngine: AggregationEngineService,
    private scoringEngine: ScoringEngineService,
    @InjectRepository(SearchSession)
    private searchSessionsRepository: Repository<SearchSession>,
    @InjectRepository(Recommendation)
    private recommendationsRepository: Repository<Recommendation>,
    @InjectRepository(UserPreference)
    private userPreferencesRepository: Repository<UserPreference>
  ) {}

  /**
   * Пошаговый сценарий "Подобрать лучший вариант"
   */
  async findBestOptions(params: {
    userId?: string
    tripPurpose: 'work' | 'leisure' | 'urgent'
    checkIn: Date
    checkOut: Date
    budget?: { min?: number; max?: number }
    priorities?: {
      quiet?: number
      center?: number
      comfort?: number
      price?: number
    }
    city?: string
    coordinates?: { lat: number; lng: number; radius?: number }
  }): Promise<{
    recommendations: Array<{
      listing: UnifiedListing
      score: number
      explanation: any
    }>
    sessionId: string
  }> {
    // Создание сессии поиска
    const session = this.searchSessionsRepository.create({
      userId: params.userId || null,
      searchParams: {
        checkIn: params.checkIn.toISOString(),
        checkOut: params.checkOut.toISOString(),
        tripPurpose: params.tripPurpose,
        priceRange: params.budget,
        priorities: params.priorities,
        city: params.city,
        coordinates: params.coordinates,
      },
    })
    const savedSession = await this.searchSessionsRepository.save(session)

    // Получение предпочтений пользователя
    let userPreferences: UserPreference['preferences'] | undefined
    if (params.userId) {
      const pref = await this.userPreferencesRepository.findOne({
        where: { userId: params.userId },
      })
      userPreferences = pref?.preferences
    }

    // Агрегация объявлений
    const listings = await this.aggregationEngine.aggregateListings({
      city: params.city,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      coordinates: params.coordinates,
      priceRange: params.budget,
    })

    // Вычисление scores для всех объявлений
    const scoredListings = await Promise.all(
      listings.map(async (listing) => {
        const factors = await this.scoringEngine.calculateFactors(
          listing,
          savedSession.searchParams,
          userPreferences
        )
        const score = await this.scoringEngine.calculateScore(
          listing,
          savedSession.searchParams,
          userPreferences
        )
        const explanation = await this.scoringEngine.getExplanation(listing, score, factors)

        return {
          listing,
          score,
          explanation,
        }
      })
    )

    // Сортировка по score и выбор топ-3
    const topRecommendations = scoredListings
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    // Сохранение рекомендаций
    if (topRecommendations.length > 0) {
      const recommendation = this.recommendationsRepository.create({
        searchSessionId: savedSession.id,
        listingIds: topRecommendations.map((r) => r.listing.internalId),
        explanation: {
          primaryReason: topRecommendations[0].explanation.primaryReason,
          factors: topRecommendations[0].explanation.factors,
        },
        score: topRecommendations[0].score,
      })
      await this.recommendationsRepository.save(recommendation)
    }

    return {
      recommendations: topRecommendations,
      sessionId: savedSession.id,
    }
  }

  /**
   * Получение истории поисков пользователя
   */
  async getSearchHistory(userId: string, limit = 10): Promise<SearchSession[]> {
    return this.searchSessionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['recommendations'],
    })
  }

  /**
   * Сохранение предпочтений пользователя
   */
  async saveUserPreferences(
    userId: string,
    preferences: UserPreference['preferences']
  ): Promise<UserPreference> {
    let userPref = await this.userPreferencesRepository.findOne({
      where: { userId },
    })

    if (!userPref) {
      userPref = this.userPreferencesRepository.create({
        userId,
        preferences,
      })
    } else {
      userPref.preferences = {
        ...userPref.preferences,
        ...preferences,
      }
      // Сохранение истории
      if (!userPref.history) {
        userPref.history = []
      }
      userPref.history.push({
        timestamp: new Date(),
        preferences: { ...preferences },
      })
    }

    return this.userPreferencesRepository.save(userPref)
  }

  /**
   * Получение предпочтений пользователя
   */
  async getUserPreferences(userId: string): Promise<UserPreference | null> {
    return this.userPreferencesRepository.findOne({
      where: { userId },
    })
  }
}
