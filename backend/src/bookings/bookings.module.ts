import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BookingsService } from './bookings.service'
import { BookingsController } from './bookings.controller'
import { Booking } from './entities/booking.entity'
import { ListingsModule } from '../listings/listings.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    ListingsModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
