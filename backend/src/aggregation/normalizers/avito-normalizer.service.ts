import { Injectable } from '@nestjs/common'
import {
  UnifiedListing,
  ListingSource,
  HousingType,
} from '../interfaces/unified-listing.interface'
import { RawListing } from '../interfaces/source.interface'

/**
 * Нормализатор для объявлений Avito (заглушка)
 * 
 * TODO: Реализовать реальную нормализацию когда будет доступен API/парсинг
 */
@Injectable()
export class AvitoNormalizer {
  async normalize(rawListing: RawListing): Promise<UnifiedListing> {
    // TODO: Преобразование данных Avito в UnifiedListing
    // Пример структуры:
    const avitoData = rawListing.rawData

    // Заглушка - возвращаем базовую структуру
    return {
      internalId: `avito_${rawListing.externalId}`,
      source: ListingSource.AVITO,
      externalId: rawListing.externalId,
      housingType: HousingType.APARTMENT, // TODO: определить из данных
      title: avitoData.title || 'Объявление Avito',
      description: avitoData.description || '',
      address: {
        city: avitoData.city || '',
        fullAddress: avitoData.address || '',
      },
      coordinates: {
        lat: avitoData.latitude || 0,
        lng: avitoData.longitude || 0,
      },
      pricePerDay: this.normalizePrice(avitoData.price),
      currency: 'RUB',
      rating: null,
      reviewsCount: 0,
      photos: [],
      conditions: {
        maxGuests: avitoData.guests || 2,
        amenities: [],
      },
      availabilityCalendar: {
        availableDates: [],
        blockedDates: [],
      },
      trustScore: 0.7, // Средний trust score для внешнего источника
      lastUpdatedAt: rawListing.fetchedAt,
      createdAt: rawListing.fetchedAt,
    }
  }

  /**
   * Нормализация цены из формата Avito в рубли за сутки
   */
  private normalizePrice(price: any): number {
    // TODO: Реальная логика нормализации цены
    if (typeof price === 'number') {
      return price
    }
    return 0
  }
}
