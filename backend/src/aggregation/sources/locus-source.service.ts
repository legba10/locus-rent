import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Listing } from '../../listings/entities/listing.entity'
import { IListingSource, SourceFetchParams, RawListing } from '../interfaces/source.interface'
import { UnifiedListing, ListingSource } from '../interfaces/unified-listing.interface'

/**
 * Источник данных из внутренней базы LOCUS
 */
@Injectable()
export class LocusSourceService implements IListingSource {
  sourceId = 'locus'
  sourceName = 'LOCUS'
  trustLevel = 1.0 // Максимальное доверие к собственным данным

  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>
  ) {}

  async fetchListings(params: SourceFetchParams): Promise<RawListing[]> {
    const query = this.listingsRepository.createQueryBuilder('listing')
      .leftJoinAndSelect('listing.owner', 'owner')
      .where('listing.status = :status', { status: 'active' })

    if (params.city) {
      query.andWhere('listing.city ILIKE :city', { city: `%${params.city}%` })
    }

    if (params.coordinates) {
      const { lat, lng, radius = 10 } = params.coordinates
      // Простой расчет расстояния (можно улучшить с PostGIS)
      query.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(listing.latitude)) * 
        cos(radians(listing.longitude) - radians(:lng)) + 
        sin(radians(:lat)) * sin(radians(listing.latitude)))) <= :radius`,
        { lat, lng, radius }
      )
    }

    if (params.priceRange) {
      if (params.priceRange.min) {
        query.andWhere('listing.pricePerNight >= :minPrice', { minPrice: params.priceRange.min })
      }
      if (params.priceRange.max) {
        query.andWhere('listing.pricePerNight <= :maxPrice', { maxPrice: params.priceRange.max })
      }
    }

    if (params.guests) {
      query.andWhere('listing.maxGuests >= :guests', { guests: params.guests })
    }

    if (params.limit) {
      query.limit(params.limit)
    }

    const listings = await query.getMany()

    return listings.map(listing => ({
      externalId: listing.id,
      source: this.sourceId,
      rawData: listing,
      fetchedAt: new Date(),
    }))
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.listingsRepository.count()
      return true
    } catch {
      return false
    }
  }
}
