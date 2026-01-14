import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Listing } from '../../listings/entities/listing.entity'
import { Booking } from '../../bookings/entities/booking.entity'
import { Review } from '../../reviews/entities/review.entity'
import { User } from '../../users/entities/user.entity'

/**
 * Trust Service - система доверия внутри платформы LOCUS
 * 
 * Определяет уровень доверия к объявлениям и хозяевам
 */
@Injectable()
export class TrustService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  /**
   * Проверка хозяина на надёжность
   */
  async checkOwnerTrust(ownerId: string): Promise<{
    isVerified: boolean
    trustLevel: number // 0-1
    flags: string[]
  }> {
    const owner = await this.usersRepository.findOne({ where: { id: ownerId } })
    if (!owner) {
      return { isVerified: false, trustLevel: 0, flags: ['owner_not_found'] }
    }

    const flags: string[] = []
    let trustLevel = 0.5 // Базовый уровень

    // Количество успешных бронирований
    const successfulBookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.listing', 'listing')
      .where('listing.ownerId = :ownerId', { ownerId })
      .andWhere('booking.status = :status', { status: 'completed' })
      .getCount()

    if (successfulBookings > 20) {
      trustLevel += 0.3
      flags.push('experienced_owner')
    } else if (successfulBookings > 10) {
      trustLevel += 0.2
    } else if (successfulBookings > 5) {
      trustLevel += 0.1
    }

    // Средний рейтинг объявлений
    const listings = await this.listingsRepository.find({
      where: { ownerId },
      relations: ['reviews'],
    })

    if (listings.length > 0) {
      const avgRating =
        listings.reduce((sum, l) => sum + (l.rating || 0), 0) / listings.length

      if (avgRating >= 4.5) {
        trustLevel += 0.2
        flags.push('high_rated_owner')
      } else if (avgRating >= 4.0) {
        trustLevel += 0.1
      }
    }

    // Количество отзывов
    const totalReviews = listings.reduce((sum, l) => sum + (l.reviewsCount || 0), 0)
    if (totalReviews > 50) {
      trustLevel += 0.1
      flags.push('many_reviews')
    }

    // Проверка активности (недавние бронирования)
    const recentBookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.listing', 'listing')
      .where('listing.ownerId = :ownerId', { ownerId })
      .andWhere('booking.createdAt > :date', {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 дней
      })
      .getCount()

    if (recentBookings > 0) {
      trustLevel += 0.1
      flags.push('active_owner')
    }

    trustLevel = Math.min(1, trustLevel)

    return {
      isVerified: trustLevel >= 0.7,
      trustLevel,
      flags,
    }
  }

  /**
   * Проверка объявления на качество
   */
  async checkListingQuality(listing: Listing): Promise<{
    qualityScore: number // 0-1
    issues: string[]
  }> {
    const issues: string[] = []
    let qualityScore = 1.0

    // Проверка фото
    if (!listing.images || listing.images.length === 0) {
      issues.push('no_photos')
      qualityScore -= 0.3
    } else if (listing.images.length < 3) {
      issues.push('few_photos')
      qualityScore -= 0.15
    }

    // Проверка описания
    if (!listing.description || listing.description.length < 50) {
      issues.push('short_description')
      qualityScore -= 0.2
    }

    // Проверка координат
    if (!listing.latitude || !listing.longitude) {
      issues.push('no_coordinates')
      qualityScore -= 0.2
    }

    // Проверка удобств
    if (!listing.amenities || listing.amenities.length === 0) {
      issues.push('no_amenities')
      qualityScore -= 0.1
    }

    // Проверка рейтинга
    if (!listing.rating && listing.reviewsCount === 0) {
      issues.push('no_reviews')
      qualityScore -= 0.1
    }

    qualityScore = Math.max(0, qualityScore)

    return {
      qualityScore,
      issues,
    }
  }

  /**
   * Скрытие слабых вариантов из рекомендаций
   */
  async shouldHideFromRecommendations(listing: Listing): Promise<boolean> {
    const ownerTrust = await this.checkOwnerTrust(listing.ownerId)
    const listingQuality = await this.checkListingQuality(listing)

    // Скрываем если:
    // - Низкое доверие к хозяину (< 0.3)
    // - Низкое качество объявления (< 0.4)
    // - Нет фото и описания
    if (ownerTrust.trustLevel < 0.3) {
      return true
    }

    if (listingQuality.qualityScore < 0.4) {
      return true
    }

    if (listingQuality.issues.includes('no_photos') && listingQuality.issues.includes('short_description')) {
      return true
    }

    return false
  }
}
