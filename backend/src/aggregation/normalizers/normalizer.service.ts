import { Injectable } from '@nestjs/common'
import {
  UnifiedListing,
  ListingSource,
  HousingType,
  NormalizationResult,
} from '../interfaces/unified-listing.interface'
import { RawListing } from '../interfaces/source.interface'
import { LocusNormalizer } from './locus-normalizer.service'
import { AvitoNormalizer } from './avito-normalizer.service'
import { SutochnoNormalizer } from './sutochno-normalizer.service'

/**
 * Сервис нормализации объявлений из разных источников
 * Приводит все объявления к единому формату UnifiedListing
 */
@Injectable()
export class NormalizerService {
  constructor(
    private locusNormalizer: LocusNormalizer,
    private avitoNormalizer: AvitoNormalizer,
    private sutochnoNormalizer: SutochnoNormalizer
  ) {}

  /**
   * Нормализация объявления из любого источника
   */
  async normalize(rawListing: RawListing): Promise<NormalizationResult> {
    try {
      let unifiedListing: UnifiedListing

      switch (rawListing.source) {
        case 'locus':
          unifiedListing = await this.locusNormalizer.normalize(rawListing)
          break
        case 'avito':
          unifiedListing = await this.avitoNormalizer.normalize(rawListing)
          break
        case 'sutochno':
          unifiedListing = await this.sutochnoNormalizer.normalize(rawListing)
          break
        default:
          return {
            success: false,
            errors: [`Unknown source: ${rawListing.source}`],
          }
      }

      return {
        success: true,
        unifiedListing,
      }
    } catch (error) {
      return {
        success: false,
        errors: [error.message || 'Normalization failed'],
      }
    }
  }

  /**
   * Массовая нормализация
   */
  async normalizeBatch(rawListings: RawListing[]): Promise<NormalizationResult[]> {
    return Promise.all(rawListings.map(listing => this.normalize(listing)))
  }
}
