import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Booking, BookingStatus } from './entities/booking.entity'
import { CreateBookingDto } from './dto/create-booking.dto'
import { UpdateBookingDto } from './dto/update-booking.dto'
import { ListingsService } from '../listings/listings.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private listingsService: ListingsService,
    private notificationsService: NotificationsService
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string): Promise<Booking> {
    const listing = await this.listingsService.findOne(createBookingDto.listingId)
    
    if (!listing) {
      throw new NotFoundException('Объявление не найдено')
    }

    // Проверка доступности дат
    const isAvailable = await this.checkAvailability(
      createBookingDto.listingId,
      new Date(createBookingDto.checkIn),
      new Date(createBookingDto.checkOut)
    )

    if (!isAvailable) {
      throw new BadRequestException('Выбранные даты недоступны')
    }

    // Расчет стоимости
    const totalPrice = this.calculatePrice(
      listing.pricePerNight,
      new Date(createBookingDto.checkIn),
      new Date(createBookingDto.checkOut),
      createBookingDto.guests
    )

    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      checkIn: new Date(createBookingDto.checkIn),
      checkOut: new Date(createBookingDto.checkOut),
      listing: listing as any,
      user: { id: userId } as any,
      totalPrice,
      status: BookingStatus.PENDING,
    })

    const savedBooking = await this.bookingsRepository.save(booking)

    // Отправка уведомлений
    await this.notificationsService.sendBookingNotification(savedBooking)

    return savedBooking
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingsRepository.find({
      relations: ['user', 'listing'],
    })
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['user', 'listing'],
    })
    if (!booking) {
      throw new NotFoundException('Бронирование не найдено')
    }
    return booking
  }

  async findByUser(userId: string): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: { user: { id: userId } as any },
      relations: ['listing'],
      order: { createdAt: 'DESC' },
    })
  }

  async findByListing(listingId: string): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: { listing: { id: listingId } as any },
      relations: ['user'],
    })
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    await this.bookingsRepository.update(id, updateBookingDto)
    const booking = await this.findOne(id)
    
    // Отправка уведомления об изменении статуса
    if (updateBookingDto.status) {
      await this.notificationsService.sendBookingStatusUpdate(booking)
    }
    
    return booking
  }

  async remove(id: string): Promise<void> {
    await this.bookingsRepository.delete(id)
  }

  private async checkAvailability(
    listingId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<boolean> {
    const conflictingBookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.listingId = :listingId', { listingId })
      .andWhere('booking.status IN (:...statuses)', { statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED] })
      .andWhere(
        '(booking.checkIn <= :checkOut AND booking.checkOut >= :checkIn)',
        { checkIn, checkOut }
      )
      .getCount()

    return conflictingBookings === 0
  }

  private calculatePrice(
    pricePerNight: number,
    checkIn: Date,
    checkOut: Date,
    guests: number
  ): number {
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )
    return pricePerNight * nights * guests
  }
}
