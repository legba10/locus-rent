import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AggregatedListing } from '../entities/aggregated-listing.entity'
import { UnifiedListing } from '../interfaces/unified-listing.interface'

/**
 * Антифрод сервис
 * Определяет подозрительные объявления и вычисляет trust score
 */
@Injectable()
export class AntifraudService {
  constructor(
    @InjectRepository(AggregatedListing)
    private aggregatedListingsRepository: Repository<AggregatedListing>
  ) {}

  /**
   * Проверка объявления на подозрительность
   */
  async checkListing(listing: UnifiedListing): Promise<{
    isSuspicious: boolean
    trustScore: number
    flags: string[]
  }> {
    const flags: string[] = []
    let trustScore = 1.0

    // Проверка 1: Наличие фото
    if (!listing.photos || listing.photos.length === 0) {
      flags.push('no_photos')
      trustScore -= 0.2
    } else if (listing.photos.length < 3) {
      flags.push('few_photos')
      trustScore -= 0.1
    }

    // Проверка 2: Наличие описания
    if (!listing.description || listing.description.length < 50) {
      flags.push('short_description')
      trustScore -= 0.15
    }

    // Проверка 3: Наличие координат
    if (!listing.coordinates.lat || !listing.coordinates.lng) {
      flags.push('no_coordinates')
      trustScore -= 0.2
    }

    // Проверка 4: Подозрительно низкая цена
    if (listing.pricePerDay < 500) {
      flags.push('suspiciously_low_price')
      trustScore -= 0.15
    }

    // Проверка 5: Отсутствие рейтинга и отзывов
    if (!listing.rating && listing.reviewsCount === 0) {
      flags.push('no_reviews')
      trustScore -= 0.1
    }

    // Проверка 6: Источник с низким уровнем доверия
    const sourceTrustLevels: Record<string, number> = {
      locus: 1.0,
      sutochno: 0.8,
      avito: 0.7,
      cian: 0.75,
    }
    const sourceTrust = sourceTrustLevels[listing.source] || 0.5
    trustScore *= sourceTrust

    // Проверка 7: Дубликаты (уже обработано в дедупликации)

    // Проверка 8: Актуальность данных
    const daysSinceUpdate =
      (Date.now() - listing.lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate > 30) {
      flags.push('outdated')
      trustScore -= 0.1
    }

    // Проверка 9: Полнота данных
    const completeness = this.calculateCompleteness(listing)
    if (completeness < 0.5) {
      flags.push('incomplete_data')
      trustScore -= 0.15
    }

    trustScore = Math.max(0, Math.min(1, trustScore))

    return {
      isSuspicious: flags.length >= 3 || trustScore < 0.4,
      trustScore,
      flags,
    }
  }

  /**
   * Вычисление полноты данных объявления
   */
  private calculateCompleteness(listing: UnifiedListing): number {
    let score = 0
    let maxScore = 0

    // Фото
    maxScore += 1
    score += listing.photos.length > 0 ? 1 : 0

    // Описание
    maxScore += 1
    score += listing.description.length > 50 ? 1 : 0

    // Координаты
    maxScore += 1
    score += listing.coordinates.lat && listing.coordinates.lng ? 1 : 0

    // Удобства
    maxScore += 1
    score += listing.conditions.amenities.length > 0 ? 1 : 0

    // Рейтинг
    maxScore += 1
    score += listing.rating !== null ? 1 : 0

    // Адрес
    maxScore += 1
    score += listing.address.fullAddress ? 1 : 0

    return maxScore > 0 ? score / maxScore : 0
  }

  /**
   * Массовая проверка объявлений
   */
  async checkBatch(listings: UnifiedListing[]): Promise<Map<string, any>> {
    const results = new Map()

    for (const listing of listings) {
      const check = await this.checkListing(listing)
      results.set(listing.internalId, check)
    }

    return results
  }

  /**
   * Обновление trust score для всех объявлений
   */
  async updateTrustScores(): Promise<void> {
    const listings = await this.aggregatedListingsRepository.find({
      where: { isHidden: false },
    })

    for (const aggregated of listings) {
      const listing = aggregated.normalizedData as UnifiedListing
      const check = await this.checkListing(listing)

      aggregated.trustScore = check.trustScore
      aggregated.isSuspicious = check.isSuspicious

      if (check.isSuspicious && check.trustScore < 0.3) {
        aggregated.isHidden = true // Скрываем очень подозрительные
      }

      await this.aggregatedListingsRepository.save(aggregated)
    }
  }
}
