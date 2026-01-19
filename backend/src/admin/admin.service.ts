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

    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Новые пользователи
    const newUsersDay = users.filter((u) => new Date(u.createdAt) >= dayAgo).length
    const newUsersWeek = users.filter((u) => new Date(u.createdAt) >= weekAgo).length
    const newUsersMonth = users.filter((u) => new Date(u.createdAt) >= monthAgo).length

    // Объявления
    const listingsActive = listings.filter((l) => l.status === 'active')
    const listingsModeration = listings.filter((l) => l.status === 'moderation')

    // Бронирования
    const bookingsTotal = bookings.length
    const bookingsConfirmed = bookings.filter((b) => b.status === 'confirmed')
    const bookingsTotalAmount = bookingsConfirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const averageCheck = bookingsConfirmed.length > 0 ? bookingsTotalAmount / bookingsConfirmed.length : 0

    // Юнит-экономика (заглушки, подготовка под ЮKassa)
    const platformRevenue = 0 // Пока 0, будет интегрировано с ЮKassa
    const commission = 0 // Заглушка комиссии
    const commissionRate = 0.1 // 10% комиссия (заглушка)

    return {
      users: {
        total: users.length,
        active: users.filter((u) => u.isActive).length,
        newToday: newUsersDay,
        newThisWeek: newUsersWeek,
        newThisMonth: newUsersMonth,
      },
      listings: {
        total: listings.length,
        active: listingsActive.length,
        moderation: listingsModeration.length,
        published: listingsActive.length,
      },
      bookings: {
        total: bookingsTotal,
        confirmed: bookingsConfirmed.length,
        pending: bookings.filter((b) => b.status === 'pending').length,
        totalAmount: bookingsTotalAmount,
        averageCheck: Math.round(averageCheck),
      },
      economics: {
        platformRevenue,
        commission,
        commissionRate,
        averageCheck: Math.round(averageCheck),
      },
    }
  }

  async getListingsForModeration() {
    return this.listingsService.findForModeration()
  }

  async moderateListing(id: string, status: string, revisionReason?: string) {
    const updateData: any = { status }
    if (revisionReason) {
      updateData.revisionReason = revisionReason
    }
    return this.listingsService.update(id, updateData)
  }

  async getAllUsers() {
    return this.usersService.findAll()
  }

  async blockUser(id: string) {
    return this.usersService.update(id, { isActive: false } as any)
  }

  async promoteToAdmin(emailOrPhone: string) {
    const user = await this.usersService.findByEmail(emailOrPhone) || 
                 await this.usersService.findByPhone(emailOrPhone)
    
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    return this.usersService.update(user.id, { role: 'admin' } as any)
  }
}
