import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import { VerificationService } from './verification.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { UserRole } from '../users/entities/user.entity'
import { VerificationType } from './entities/verification-code.entity'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private verificationService: VerificationService
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, phone, password, firstName, lastName } = registerDto

    // Проверка существования пользователя
    if (email) {
      const existingUser = await this.usersService.findByEmail(email)
      if (existingUser) {
        throw new BadRequestException('Пользователь с таким email уже существует')
      }
    }

    if (phone) {
      const existingUser = await this.usersService.findByPhone(phone)
      if (existingUser) {
        throw new BadRequestException('Пользователь с таким телефоном уже существует')
      }
    }

    // Проверка наличия email или телефона
    if (!email && !phone) {
      throw new BadRequestException('Необходимо указать email или телефон')
    }

    // Проверка наличия пароля
    if (!password) {
      throw new BadRequestException('Пароль обязателен')
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создание пользователя
    const user = await this.usersService.create({
      email,
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      role: UserRole.USER,
    })

    // Генерация токена
    const payload = { sub: user.id, email: user.email, role: user.role }
    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  }

  async login(loginDto: LoginDto) {
    const { email, phone, password } = loginDto

    let user
    if (email) {
      user = await this.usersService.findByEmail(email)
    } else if (phone) {
      user = await this.usersService.findByPhone(phone)
    } else {
      throw new BadRequestException('Необходимо указать email или телефон')
    }

    if (!user) {
      throw new UnauthorizedException('Неверные учетные данные')
    }

    // Проверка пароля
    if (password && user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        throw new UnauthorizedException('Неверные учетные данные')
      }
    } else {
      throw new UnauthorizedException('Неверные учетные данные')
    }

    // Генерация токена
    const payload = { sub: user.id, email: user.email, role: user.role }
    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  }

  async validateUser(userId: string) {
    return this.usersService.findOne(userId)
  }

  /**
   * Подтверждение email или телефона
   */
  async verifyUserContact(userId: string, type: VerificationType) {
    const user = await this.usersService.findOne(userId)
    
    if (type === VerificationType.EMAIL) {
      user.emailVerified = true
    } else if (type === VerificationType.PHONE) {
      user.phoneVerified = true
    }

    await this.usersService.update(userId, user)
    return user
  }

  /**
   * Авторизация через Telegram
   */
  async telegramLogin(telegramLoginDto: any) {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = telegramLoginDto

    // Валидация Telegram данных (упрощенная версия)
    // В production нужно проверять hash через Telegram Bot API
    // Пример: https://core.telegram.org/widgets/login#checking-authorization

    const telegramId = id.toString()

    // Поиск существующего пользователя
    let user = await this.usersService.findByTelegramId(telegramId)

    if (!user) {
      // Создание нового пользователя
      const hashedPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10)
      user = await this.usersService.create({
        firstName: first_name || 'Пользователь',
        lastName: last_name,
        telegramId,
        password: hashedPassword,
        role: UserRole.USER,
        avatar: photo_url,
        phoneVerified: true, // Telegram ID считается подтвержденным
      })
    } else {
      // Обновление данных пользователя, если они изменились
      const updateData: any = {}
      if (first_name && first_name !== user.firstName) updateData.firstName = first_name
      if (last_name && last_name !== user.lastName) updateData.lastName = last_name
      if (photo_url && photo_url !== user.avatar) updateData.avatar = photo_url
      
      if (Object.keys(updateData).length > 0) {
        await this.usersService.update(user.id, updateData)
        user = await this.usersService.findOne(user.id)
      }
    }

    // Генерация токена
    const payload = { sub: user.id, email: user.email, role: user.role, telegramId: user.telegramId }
    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        telegramId: user.telegramId,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    }
  }
}
