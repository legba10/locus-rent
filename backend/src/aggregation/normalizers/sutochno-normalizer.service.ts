import { Injectable } from '@nestjs/common'
import {
  UnifiedListing,
  ListingSource,
  HousingType,
} from '../interfaces/unified-listing.interface'
import { RawListing } from '../interfaces/source.interface'

/**
 * Нормализатор для объявлений Суточно.ру (заглушка)
 */
@Injectable()
export class SutochnoNormalizer {
  async normalize(rawListing: RawListing): Promise<UnifiedListing> {
    // TODO: Реальная нормализация данных Суточно.ру
    const sutochnoData = rawListing.rawData

    return {
      internalId: `sutochno_${rawListing.externalId}`,
      source: ListingSource.SUTOCHNO,
      externalId: rawListing.externalId,
      housingType: HousingType.APARTMENT,
      title: sutochnoData.title || 'Объявление Суточно.ру',
      description: sutochnoData.description || '',
      address: {
        city: sutochnoData.city || '',
        fullAddress: sutochnoData.address || '',
      },
      coordinates: {
        lat: sutochnoData.latitude || 0,
        lng: sutochnoData.longitude || 0,
      },
      pricePerDay: this.normalizePrice(sutochnoData.price),
      currency: 'RUB',
      rating: sutochnoData.rating || null,
      reviewsCount: sutochnoData.reviewsCount || 0,
      photos: [],
      conditions: {
        maxGuests: sutochnoData.guests || 2,
        amenities: [],
      },
      availabilityCalendar: {
        availableDates: [],
        blockedDates: [],
      },
      trustScore: 0.8,
      lastUpdatedAt: rawListing.fetchedAt,
      createdAt: rawListing.fetchedAt,
    }
  }

  private normalizePrice(price: any): number {
    // TODO: Реальная логика нормализации
    return typeof price === 'number' ? price : 0
  }
}
