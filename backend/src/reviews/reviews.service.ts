import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Review } from './entities/review.entity'
import { CreateReviewDto } from './dto/create-review.dto'
import { ListingsService } from '../listings/listings.service'

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    private listingsService: ListingsService
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<Review> {
    const listing = await this.listingsService.findOne(createReviewDto.listingId)
    
    if (!listing) {
      throw new NotFoundException('Объявление не найдено')
    }

    const review = this.reviewsRepository.create({
      ...createReviewDto,
      listing: listing as any,
      user: { id: userId } as any,
    })

    const savedReview = await this.reviewsRepository.save(review)

    // Обновление рейтинга объявления
    await this.updateListingRating(createReviewDto.listingId)

    return savedReview
  }

  async findAll(): Promise<Review[]> {
    return this.reviewsRepository.find({
      relations: ['user', 'listing'],
      order: { createdAt: 'DESC' },
    })
  }

  async findByListing(listingId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { listing: { id: listingId } as any },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'listing'],
    })
    if (!review) {
      throw new NotFoundException('Отзыв не найден')
    }
    return review
  }

  async remove(id: string): Promise<void> {
    await this.reviewsRepository.delete(id)
  }

  private async updateListingRating(listingId: string): Promise<void> {
    const reviews = await this.reviewsRepository.find({
      where: { listing: { id: listingId } as any },
    })

    if (reviews.length === 0) return

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

    await this.listingsService.update(listingId, {
      rating: averageRating,
      reviewsCount: reviews.length,
    } as any)
  }
}
