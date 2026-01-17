import { Injectable, Logger } from '@nestjs/common'
import { Booking } from '../bookings/entities/booking.entity'
import { TelegramService } from '../telegram/telegram.service'
import * as nodemailer from 'nodemailer'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  private transporter: nodemailer.Transporter

  constructor(private telegramService: TelegramService) {
    // Настройка email транспорта
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn('SMTP credentials not configured, skipping email send')
      return
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
      })
      this.logger.log(`Email sent to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error)
      throw error
    }
  }

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
