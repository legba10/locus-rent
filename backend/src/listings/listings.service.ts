import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Not } from 'typeorm'
import { Listing, ListingStatus } from './entities/listing.entity'
import { CreateListingDto } from './dto/create-listing.dto'
import { UpdateListingDto } from './dto/update-listing.dto'
import { SearchListingsDto } from './dto/search-listings.dto'

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>
  ) {}

  async create(createListingDto: CreateListingDto, userId: string): Promise<Listing> {
    // КРИТИЧНО: санитизация images - гарантируем массив и фильтруем data:image
    const sanitizedImages = this.sanitizeImages(createListingDto.images || [])
    
    const listing = this.listingsRepository.create({
      ...createListingDto,
      images: sanitizedImages,
      owner: { id: userId } as any,
      // Если статус не указан или это не draft, ставим на модерацию
      status: createListingDto.status === ListingStatus.DRAFT 
        ? ListingStatus.DRAFT 
        : ListingStatus.MODERATION,
    })
    return this.listingsRepository.save(listing)
  }

  /**
   * Санитизация images[] - фильтрует data:image и гарантирует массив.
   */
  private sanitizeImages(images: unknown[]): string[] {
    if (!Array.isArray(images)) {
      return []
    }

    return images
      .filter((img): img is string => {
        if (typeof img !== 'string') return false
        const trimmed = img.trim()
        if (!trimmed) return false
        // Строго запрещаем data:image
        if (trimmed.toLowerCase().startsWith('data:image')) return false
        // Разрешаем только http(s):// URL
        return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      })
      .map((img) => img.trim())
  }

  async findAll(): Promise<Listing[]> {
    const listings = await this.listingsRepository.find({
      relations: ['owner'],
      where: { status: ListingStatus.ACTIVE },
    })
    
    // КРИТИЧНО: санитизация images для всех объявлений перед возвратом
    return listings.map((listing) => ({
      ...listing,
      images: this.sanitizeImages(listing.images || []),
    }))
  }

  async findForModeration(): Promise<Listing[]> {
    return this.listingsRepository.find({
      relations: ['owner'],
      where: { status: ListingStatus.MODERATION },
      order: { createdAt: 'DESC' },
    })
  }

  async search(searchDto: SearchListingsDto): Promise<Listing[]> {
    const query = this.listingsRepository.createQueryBuilder('listing')
      .leftJoinAndSelect('listing.owner', 'owner')
      .where('listing.status = :status', { status: 'active' })

    if (searchDto.city) {
      query.andWhere('listing.city ILIKE :city', { city: `%${searchDto.city}%` })
    }

    if (searchDto.minPrice) {
      query.andWhere('listing.pricePerNight >= :minPrice', { minPrice: searchDto.minPrice })
    }

    if (searchDto.maxPrice) {
      query.andWhere('listing.pricePerNight <= :maxPrice', { maxPrice: searchDto.maxPrice })
    }

    if (searchDto.guests) {
      query.andWhere('listing.maxGuests >= :guests', { guests: searchDto.guests })
    }

    if (searchDto.type) {
      query.andWhere('listing.type = :type', { type: searchDto.type })
    }

    if (searchDto.latitude && searchDto.longitude) {
      // Простой поиск по радиусу (можно улучшить с PostGIS)
      query.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(listing.latitude)) * 
        cos(radians(listing.longitude) - radians(:lng)) + 
        sin(radians(:lat)) * sin(radians(listing.latitude)))) <= :radius`,
        {
          lat: searchDto.latitude,
          lng: searchDto.longitude,
          radius: searchDto.radius || 10,
        }
      )
    }

    const listings = await query.getMany()
    
    // КРИТИЧНО: санитизация images для всех объявлений перед возвратом
    return listings.map((listing) => ({
      ...listing,
      images: this.sanitizeImages(listing.images || []),
    }))
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['owner', 'reviews'],
    })
    if (!listing) {
      throw new NotFoundException('Объявление не найдено')
    }
    
    // КРИТИЧНО: санитизация images перед возвратом
    listing.images = this.sanitizeImages(listing.images || [])
    return listing
  }

  async findByOwner(ownerId: string): Promise<Listing[]> {
    // Показываем ВСЕ объявления пользователя, включая на модерации, опубликованные и отклоненные
    const listings = await this.listingsRepository.find({
      where: {
        owner: { id: ownerId } as any,
      },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    })
    
    // КРИТИЧНО: санитизация images для всех объявлений перед возвратом
    return listings.map((listing) => ({
      ...listing,
      images: this.sanitizeImages(listing.images || []),
    }))
  }

  async update(id: string, updateListingDto: UpdateListingDto): Promise<Listing> {
    const listing = await this.findOne(id)
    
    // КРИТИЧНО: санитизация images при обновлении
    if (updateListingDto.images !== undefined) {
      updateListingDto.images = this.sanitizeImages(updateListingDto.images)
    }
    
    Object.assign(listing, updateListingDto)
    return this.listingsRepository.save(listing)
  }

  async remove(id: string): Promise<void> {
    // Мягкое удаление: помечаем объявление как REJECTED, чтобы не показывать в списках
    const listing = await this.findOne(id)
    listing.status = ListingStatus.REJECTED
    await this.listingsRepository.save(listing)
  }

  /**
   * Дублирование объявления для того же владельца.
   * Новое объявление создаётся в статусе DRAFT.
   */
  async duplicate(id: string, ownerId: string): Promise<Listing> {
    const listing = await this.findOne(id)

    // Проверяем, что объявление принадлежит текущему пользователю
    if (listing.ownerId !== ownerId) {
      throw new ForbiddenException('Вы не можете дублировать это объявление')
    }

    const { id: _id, createdAt, updatedAt, reviews, bookings, ...rest } = listing

    const duplicateListing = this.listingsRepository.create({
      ...rest,
      title: `Копия: ${listing.title}`,
      status: ListingStatus.DRAFT,
      owner: { id: ownerId } as any,
    })

    return this.listingsRepository.save(duplicateListing)
  }
}
