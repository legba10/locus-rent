import { Injectable } from '@nestjs/common'
import { IListingSource, SourceFetchParams, RawListing } from '../interfaces/source.interface'

/**
 * Адаптер для Суточно.ру (заглушка для будущей интеграции)
 */
@Injectable()
export class SutochnoSourceService implements IListingSource {
  sourceId = 'sutochno'
  sourceName = 'Суточно.ру'
  trustLevel = 0.8 // Высокий уровень доверия

  async fetchListings(params: SourceFetchParams): Promise<RawListing[]> {
    // TODO: Реальная интеграция с Суточно.ру API
    console.log(`[SutochnoSource] Fetching listings with params:`, params)
    return []
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Проверка доступности API
    return false
  }
}
