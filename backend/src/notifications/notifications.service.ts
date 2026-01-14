import { Injectable } from '@nestjs/common'
import { Booking } from '../bookings/entities/booking.entity'
import { TelegramService } from '../telegram/telegram.service'

@Injectable()
export class NotificationsService {
  constructor(private telegramService: TelegramService) {}

  async sendBookingNotification(booking: Booking): Promise<void> {
    // Email уведомление (можно добавить nodemailer)
    // await this.sendEmail(...)

    // Telegram уведомление
    if (booking.user && (booking.user as any).telegramId) {
      const listing = booking.listing as any
      await this.telegramService.sendMessage(
        (booking.user as any).telegramId,
        `Новое бронирование!\n\nОбъявление: ${listing?.title || 'N/A'}\nДаты: ${booking.checkIn} - ${booking.checkOut}\nГостей: ${booking.guests}`
      )
    }
  }

  async sendBookingStatusUpdate(booking: Booking): Promise<void> {
    if (booking.user && (booking.user as any).telegramId) {
      await this.telegramService.sendMessage(
        (booking.user as any).telegramId,
        `Статус бронирования изменен: ${booking.status}`
      )
    }
  }
}
