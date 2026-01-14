import { Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { ListingsService } from '../listings/listings.service'
import { BookingsService } from '../bookings/bookings.service'

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private listingsService: ListingsService,
    private bookingsService: BookingsService
  ) {}

  async getStats() {
    const users = await this.usersService.findAll()
    const listings = await this.listingsService.findAll()
    const bookings = await this.bookingsService.findAll()

    return {
      users: {
        total: users.length,
        active: users.filter((u) => u.isActive).length,
      },
      listings: {
        total: listings.length,
        active: listings.filter((l) => l.status === 'active').length,
        moderation: listings.filter((l) => l.status === 'moderation').length,
      },
      bookings: {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === 'pending').length,
        confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      },
    }
  }

  async getListingsForModeration() {
    const listings = await this.listingsService.findAll()
    return listings.filter((l) => l.status === 'moderation')
  }

  async moderateListing(id: string, status: string) {
    return this.listingsService.update(id, { status } as any)
  }

  async getAllUsers() {
    return this.usersService.findAll()
  }

  async blockUser(id: string) {
    return this.usersService.update(id, { isActive: false } as any)
  }
}
