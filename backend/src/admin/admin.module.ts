import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { UsersModule } from '../users/users.module'
import { ListingsModule } from '../listings/listings.module'
import { BookingsModule } from '../bookings/bookings.module'

@Module({
  imports: [UsersModule, ListingsModule, BookingsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
