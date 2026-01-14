import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class TelegramService {
  private readonly botToken: string
  private readonly apiUrl: string

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || ''
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.botToken) {
      console.warn('Telegram bot token not configured')
      return
    }

    try {
      await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      })
    } catch (error) {
      console.error('Error sending Telegram message:', error)
    }
  }

  async sendNotification(chatId: string, message: string): Promise<void> {
    await this.sendMessage(chatId, message)
  }
}
