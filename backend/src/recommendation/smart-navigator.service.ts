import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RecommendationEngineService } from './recommendation-engine.service'
import { ScoringEngineService } from './scoring/scoring-engine.service'
import { TrustService } from './trust/trust.service'
import { SearchSession } from './entities/search-session.entity'
import { Recommendation } from './entities/recommendation.entity'
import { UserPreference } from './entities/user-preference.entity'
import { Listing } from '../listings/entities/listing.entity'

/**
 * Smart Navigator Service
 * Реализует логику "умного навигатора" - подбор лучших вариантов из LOCUS
 */
@Injectable()
export class SmartNavigatorService {
  constructor(
    private recommendationEngine: RecommendationEngineService,
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
    bestMatch: {
      listing: Listing
      score: number
      explanation: any
    } | null
    alternatives: Listing[]
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

    // Получение лучшего варианта
    const bestMatch = await this.recommendationEngine.getBestMatch({
      city: params.city,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: undefined, // Можно добавить в параметры
      priceRange: params.budget,
      coordinates: params.coordinates,
      tripPurpose: params.tripPurpose,
      priorities: params.priorities,
      userId: params.userId,
    })

    // Получение альтернатив (если есть лучший вариант)
    let alternatives: Listing[] = []
    if (bestMatch.listing) {
      alternatives = await this.recommendationEngine.getAlternatives({
        excludeListingId: bestMatch.listing.id,
        city: params.city,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: undefined,
        priceRange: params.budget,
        coordinates: params.coordinates,
        tripPurpose: params.tripPurpose,
        priorities: params.priorities,
        userId: params.userId,
        limit: 2, // 2 альтернативы
      })
    }

    // Сохранение рекомендации
    if (bestMatch.listing) {
      const recommendation = this.recommendationsRepository.create({
        searchSessionId: savedSession.id,
        listingIds: [
          bestMatch.listing.id,
          ...alternatives.map((a) => a.id),
        ],
        explanation: {
          primaryReason: bestMatch.explanation.primaryReason,
          factors: bestMatch.explanation.factors,
        },
        score: bestMatch.score,
      })
      await this.recommendationsRepository.save(recommendation)

      // Обновление сессии
      savedSession.isSuccessful = true
      savedSession.selectedListingId = bestMatch.listing.id
      savedSession.resultsCount = 1 + alternatives.length
      await this.searchSessionsRepository.save(savedSession)
    }

    return {
      bestMatch: bestMatch.listing
        ? {
            listing: bestMatch.listing,
            score: bestMatch.score,
            explanation: bestMatch.explanation,
          }
        : null,
      alternatives,
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

  /**
   * Отметка "мне подошло / не подошло"
   */
  async markRecommendationFeedback(
    recommendationId: string,
    feedback: 'liked' | 'disliked'
  ): Promise<void> {
    const recommendation = await this.recommendationsRepository.findOne({
      where: { id: recommendationId },
    })

    if (recommendation) {
      if (!recommendation.explanation) {
        recommendation.explanation = {
          primaryReason: 'Рекомендация сохранена',
          factors: [],
        }
      }
      recommendation.explanation.feedback = feedback
      await this.recommendationsRepository.save(recommendation)
    }
  }
}
