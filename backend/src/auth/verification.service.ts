import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { VerificationCode, VerificationType } from './entities/verification-code.entity'
import * as nodemailer from 'nodemailer'
import * as twilio from 'twilio'

@Injectable()
export class VerificationService {
  private emailTransporter: nodemailer.Transporter
  private twilioClient: twilio.Twilio

  constructor(
    @InjectRepository(VerificationCode)
    private verificationCodeRepository: Repository<VerificationCode>
  ) {
    // Инициализация email транспортера (только если есть настройки)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }

    // Инициализация Twilio (только если есть правильные ключи)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim()
    const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim()
    
    // Проверяем, что SID начинается с 'AC' (правильный формат Twilio)
    if (twilioSid && twilioToken && twilioSid.startsWith('AC') && twilioSid.length > 10) {
      try {
        this.twilioClient = twilio(twilioSid, twilioToken)
      } catch (error) {
        console.warn('⚠️  Twilio client initialization failed:', error.message)
      }
    }
  }

  /**
   * Генерация случайного кода
   */
  private generateCode(length: number = 6): string {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0')
  }

  /**
   * Отправка кода на email
   */
  async sendEmailCode(email: string): Promise<string> {
    // Проверка лимита попыток
    const recentCodes = await this.verificationCodeRepository.count({
      where: {
        identifier: email,
        type: VerificationType.EMAIL,
        createdAt: LessThan(new Date(Date.now() - 60 * 1000)), // Последняя минута
      },
    })

    if (recentCodes > 0) {
      throw new HttpException('Повторная отправка кода возможна через 1 минуту', HttpStatus.TOO_MANY_REQUESTS)
    }

    // Удаление старых неиспользованных кодов
    await this.verificationCodeRepository.delete({
      identifier: email,
      type: VerificationType.EMAIL,
      used: false,
    })

    // Генерация нового кода
    const code = this.generateCode(6)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 минут

    const verificationCode = this.verificationCodeRepository.create({
      identifier: email,
      type: VerificationType.EMAIL,
      code,
      expiresAt,
    })

    await this.verificationCodeRepository.save(verificationCode)

    // Отправка email (заглушка, если нет SMTP настроек)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@locus.ru',
          to: email,
          subject: 'Код подтверждения LOCUS',
          html: `
            <h2>Ваш код подтверждения</h2>
            <p>Ваш код для подтверждения email: <strong>${code}</strong></p>
            <p>Код действителен в течение 5 минут.</p>
            <p>Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
          `,
        })
      } catch (error) {
        console.error('Email sending error:', error)
        // В development режиме выводим код в консоль
        if (process.env.NODE_ENV === 'development') {
          console.log(`📧 Email code for ${email}: ${code}`)
        }
      }
    } else {
      // Заглушка для development
      console.log(`📧 Email code for ${email}: ${code}`)
    }

    return code
  }

  /**
   * Отправка SMS кода
   */
  async sendSMSCode(phone: string): Promise<string> {
    // Нормализация телефона
    const normalizedPhone = phone.replace(/\D/g, '')
    const fullPhone = normalizedPhone.startsWith('7') ? `+${normalizedPhone}` : `+7${normalizedPhone}`

    // Проверка лимита попыток
    const recentCodes = await this.verificationCodeRepository.count({
      where: {
        identifier: fullPhone,
        type: VerificationType.PHONE,
        createdAt: LessThan(new Date(Date.now() - 60 * 1000)), // Последняя минута
      },
    })

    if (recentCodes > 0) {
      throw new HttpException('Повторная отправка кода возможна через 1 минуту', HttpStatus.TOO_MANY_REQUESTS)
    }

    // Удаление старых неиспользованных кодов
    await this.verificationCodeRepository.delete({
      identifier: fullPhone,
      type: VerificationType.PHONE,
      used: false,
    })

    // Генерация нового кода
    const code = this.generateCode(6)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 минут

    const verificationCode = this.verificationCodeRepository.create({
      identifier: fullPhone,
      type: VerificationType.PHONE,
      code,
      expiresAt,
    })

    await this.verificationCodeRepository.save(verificationCode)

    // Отправка SMS (заглушка, если нет Twilio настроек)
    if (this.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await this.twilioClient.messages.create({
          body: `Ваш код подтверждения LOCUS: ${code}. Код действителен 5 минут.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: fullPhone,
        })
      } catch (error) {
        console.error('SMS sending error:', error)
        // В development режиме выводим код в консоль
        if (process.env.NODE_ENV === 'development') {
          console.log(`📱 SMS code for ${fullPhone}: ${code}`)
        }
      }
    } else {
      // Заглушка для development
      console.log(`📱 SMS code for ${fullPhone}: ${code}`)
    }

    return code
  }

  /**
   * Проверка кода
   */
  async verifyCode(identifier: string, code: string, type: VerificationType): Promise<boolean> {
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        identifier,
        type,
        code,
        used: false,
      },
      order: {
        createdAt: 'DESC',
      },
    })

    if (!verificationCode) {
      // Увеличиваем счетчик попыток
      const existingCode = await this.verificationCodeRepository.findOne({
        where: {
          identifier,
          type,
          used: false,
        },
      })

      if (existingCode) {
        existingCode.attempts += 1
        await this.verificationCodeRepository.save(existingCode)

        if (existingCode.attempts >= 5) {
          // Блокировка после 5 неудачных попыток
          await this.verificationCodeRepository.delete({ id: existingCode.id })
          throw new BadRequestException('Превышено количество попыток. Запросите новый код.')
        }
      }

      throw new BadRequestException('Неверный код подтверждения')
    }

    // Проверка срока действия
    if (new Date() > verificationCode.expiresAt) {
      await this.verificationCodeRepository.delete({ id: verificationCode.id })
      throw new BadRequestException('Код подтверждения истек. Запросите новый код.')
    }

    // Помечаем код как использованный
    verificationCode.used = true
    await this.verificationCodeRepository.save(verificationCode)

    return true
  }

  /**
   * Очистка истекших кодов
   */
  async cleanupExpiredCodes(): Promise<void> {
    await this.verificationCodeRepository.delete({
      expiresAt: LessThan(new Date()),
    })
  }
}
