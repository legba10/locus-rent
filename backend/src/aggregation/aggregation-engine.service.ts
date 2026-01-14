import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IListingSource, SourceFetchParams } from './interfaces/source.interface'
import { UnifiedListing } from './interfaces/unified-listing.interface'
import { NormalizerService } from './normalizers/normalizer.service'
import { ScoringEngineService } from './scoring/scoring-engine.service'
import { AggregatedListing } from './entities/aggregated-listing.entity'
import { LocusSourceService } from './sources/locus-source.service'
import { AvitoSourceService } from './sources/avito-source.service'
import { SutochnoSourceService } from './sources/sutochno-source.service'
import * as crypto from 'crypto'

/**
 * Основной сервис Aggregation Engine
 * Координирует работу всех источников, нормализацию и дедупликацию
 */
@Injectable()
export class AggregationEngineService {
  private sources: Map<string, IListingSource> = new Map()

  constructor(
    private normalizerService: NormalizerService,
    private scoringEngine: ScoringEngineService,
    private locusSource: LocusSourceService,
    private avitoSource: AvitoSourceService,
    private sutochnoSource: SutochnoSourceService,
    @InjectRepository(AggregatedListing)
    private aggregatedListingsRepository: Repository<AggregatedListing>
  ) {
    // Регистрация источников
    this.registerSource(locusSource)
    this.registerSource(avitoSource)
    this.registerSource(sutochnoSource)
  }

  /**
   * Регистрация нового источника данных
   */
  registerSource(source: IListingSource): void {
    this.sources.set(source.sourceId, source)
  }

  /**
   * Агрегация объявлений из всех источников
   */
  async aggregateListings(params: SourceFetchParams): Promise<UnifiedListing[]> {
    const allListings: UnifiedListing[] = []

    // Загрузка из всех доступных источников параллельно
    const sourcePromises = Array.from(this.sources.values()).map(async (source) => {
      try {
        if (await source.isAvailable()) {
          const rawListings = await source.fetchListings(params)
          const normalizedResults = await this.normalizerService.normalizeBatch(rawListings)

          return normalizedResults
            .filter((result) => result.success && result.unifiedListing)
            .map((result) => result.unifiedListing!)
        }
      } catch (error) {
        console.error(`Error fetching from ${source.sourceId}:`, error)
      }
      return []
    })

    const sourceResults = await Promise.all(sourcePromises)
    const rawUnifiedListings = sourceResults.flat()

    // Дедупликация
    const deduplicated = await this.deduplicate(rawUnifiedListings)

    // Сохранение в БД
    await this.saveAggregatedListings(deduplicated)

    return deduplicated
  }

  /**
   * Дедупликация объявлений
   * Объявления с одинаковым хешом считаются дубликатами
   */
  private async deduplicate(listings: UnifiedListing[]): Promise<UnifiedListing[]> {
    const seen = new Map<string, UnifiedListing>()

    for (const listing of listings) {
      const hash = this.calculateDeduplicationHash(listing)

      if (!seen.has(hash)) {
        seen.set(hash, listing)
      } else {
        // Если дубликат найден, выбираем объявление с более высоким trust score
        const existing = seen.get(hash)!
        if (listing.trustScore > existing.trustScore) {
          seen.set(hash, listing)
        }
      }
    }

    return Array.from(seen.values())
  }

  /**
   * Вычисление хеша для дедупликации
   * Основан на адресе, координатах и типе жилья
   */
  private calculateDeduplicationHash(listing: UnifiedListing): string {
    const data = `${listing.address.fullAddress}_${listing.coordinates.lat.toFixed(4)}_${listing.coordinates.lng.toFixed(4)}_${listing.housingType}`
    return crypto.createHash('md5').update(data).digest('hex')
  }

  /**
   * Сохранение агрегированных объявлений в БД
   */
  private async saveAggregatedListings(listings: UnifiedListing[]): Promise<void> {
    for (const listing of listings) {
      const hash = this.calculateDeduplicationHash(listing)

      const existing = await this.aggregatedListingsRepository.findOne({
        where: { deduplicationHash: hash },
      })

      if (existing) {
        // Обновление существующего
        existing.normalizedData = listing as any
        existing.trustScore = listing.trustScore
        existing.lastSourceUpdate = listing.lastUpdatedAt
        await this.aggregatedListingsRepository.save(existing)
      } else {
        // Создание нового
        const aggregated = this.aggregatedListingsRepository.create({
          source: listing.source,
          externalId: listing.externalId,
          normalizedData: listing as any,
          trustScore: listing.trustScore,
          deduplicationHash: hash,
          lastSourceUpdate: listing.lastUpdatedAt,
        })
        await this.aggregatedListingsRepository.save(aggregated)
      }
    }
  }

  /**
   * Получение агрегированных объявлений из БД
   */
  async getAggregatedListings(params: {
    city?: string
    coordinates?: { lat: number; lng: number; radius?: number }
    limit?: number
  }): Promise<AggregatedListing[]> {
    const query = this.aggregatedListingsRepository.createQueryBuilder('listing')
      .where('listing.isHidden = :hidden', { hidden: false })
      .andWhere('listing.isSuspicious = :suspicious', { suspicious: false })

    if (params.city) {
      query.andWhere("listing.normalizedData->>'address'->>'city' ILIKE :city", {
        city: `%${params.city}%`,
      })
    }

    if (params.coordinates) {
      const { lat, lng, radius = 10 } = params.coordinates
      query.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians((listing.normalizedData->>'coordinates'->>'lat')::float)) * 
        cos(radians((listing.normalizedData->>'coordinates'->>'lng')::float) - radians(:lng)) + 
        sin(radians(:lat)) * sin(radians((listing.normalizedData->>'coordinates'->>'lat')::float)))) <= :radius`,
        { lat, lng, radius }
      )
    }

    if (params.limit) {
      query.limit(params.limit)
    }

    query.orderBy('listing.trustScore', 'DESC')

    return query.getMany()
  }

  /**
   * Обновление объявлений из источников (для периодической синхронизации)
   */
  async syncSources(): Promise<void> {
    const sources = Array.from(this.sources.values())

    for (const source of sources) {
      try {
        if (await source.isAvailable() && source.updateListings) {
          const rawListings = await source.updateListings()
          const normalizedResults = await this.normalizerService.normalizeBatch(rawListings)

          const unifiedListings = normalizedResults
            .filter((result) => result.success && result.unifiedListing)
            .map((result) => result.unifiedListing!)

          await this.saveAggregatedListings(unifiedListings)
        }
      } catch (error) {
        console.error(`Error syncing source ${source.sourceId}:`, error)
      }
    }
  }
}
