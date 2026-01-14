/**
 * Интерфейс для источника данных объявлений
 * Все источники должны реализовывать этот интерфейс
 */
export interface IListingSource {
  /**
   * Уникальный идентификатор источника
   */
  sourceId: string

  /**
   * Название источника
   */
  sourceName: string

  /**
   * Уровень доверия к источнику (0-1)
   */
  trustLevel: number

  /**
   * Загрузка объявлений из источника
   * @param params Параметры загрузки (даты, локация и т.д.)
   */
  fetchListings(params: SourceFetchParams): Promise<RawListing[]>

  /**
   * Проверка доступности источника
   */
  isAvailable(): Promise<boolean>

  /**
   * Обновление объявлений (для периодической синхронизации)
   */
  updateListings?(lastUpdate?: Date): Promise<RawListing[]>
}

/**
 * Параметры загрузки из источника
 */
export interface SourceFetchParams {
  city?: string
  checkIn?: Date
  checkOut?: Date
  guests?: number
  priceRange?: {
    min?: number
    max?: number
  }
  coordinates?: {
    lat: number
    lng: number
    radius?: number // в км
  }
  limit?: number
}

/**
 * Сырое объявление из внешнего источника
 * Каждый источник возвращает данные в своем формате
 */
export interface RawListing {
  externalId: string
  source: string
  rawData: Record<string, any>
  fetchedAt: Date
}
