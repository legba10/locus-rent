import { Injectable } from '@nestjs/common'
import { Listing } from '../../listings/entities/listing.entity'
import {
  UnifiedListing,
  ListingSource,
  HousingType,
} from '../interfaces/unified-listing.interface'
import { RawListing } from '../interfaces/source.interface'

/**
 * Нормализатор для внутренних объявлений LOCUS
 */
@Injectable()
export class LocusNormalizer {
  async normalize(rawListing: RawListing): Promise<UnifiedListing> {
    const listing = rawListing.rawData as Listing

    // Маппинг типов жилья
    const housingTypeMap: Record<string, HousingType> = {
      apartment: HousingType.APARTMENT,
      house: HousingType.HOUSE,
      studio: HousingType.STUDIO,
      room: HousingType.ROOM,
    }

    return {
      internalId: `locus_${listing.id}`,
      source: ListingSource.LOCUS,
      externalId: listing.id,
      housingType: housingTypeMap[listing.type] || HousingType.APARTMENT,
      title: listing.title,
      description: listing.description,
      address: {
        city: listing.city,
        district: listing.district || undefined,
        fullAddress: listing.address,
      },
      coordinates: {
        lat: Number(listing.latitude),
        lng: Number(listing.longitude),
      },
      pricePerDay: Number(listing.pricePerNight),
      pricePerWeek: listing.pricePerWeek ? Number(listing.pricePerWeek) : undefined,
      pricePerMonth: listing.pricePerMonth ? Number(listing.pricePerMonth) : undefined,
      currency: 'RUB',
      rating: listing.rating ? Number(listing.rating) : null,
      reviewsCount: listing.reviewsCount || 0,
      photos: (listing.images || []).map((url, index) => ({
        url,
        order: index,
      })),
      conditions: {
        maxGuests: listing.maxGuests,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        bathrooms: listing.bathrooms,
        amenities: listing.amenities || [],
        houseRules: listing.houseRules ? [listing.houseRules] : undefined,
      },
      availabilityCalendar: {
        availableDates: [],
        blockedDates: [],
      },
      trustScore: 1.0, // Внутренние объявления имеют максимальный trust score
      lastUpdatedAt: listing.updatedAt,
      createdAt: listing.createdAt,
    }
  }
}
