import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common'
import { AuthService } from './auth.service'
import { VerificationService } from './verification.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { SendCodeDto } from './dto/send-code.dto'
import { VerifyCodeDto } from './dto/verify-code.dto'
import { TelegramLoginDto } from './dto/telegram-login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() sendCodeDto: SendCodeDto) {
    if (sendCodeDto.type === 'email') {
      await this.verificationService.sendEmailCode(sendCodeDto.identifier)
    } else {
      await this.verificationService.sendSMSCode(sendCodeDto.identifier)
    }
    return { message: 'Код отправлен' }
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    await this.verificationService.verifyCode(
      verifyCodeDto.identifier,
      verifyCodeDto.code,
      verifyCodeDto.type
    )
    return { message: 'Код подтвержден' }
  }

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async loginWithTelegram(@Body() telegramData: TelegramLoginDto) {
    // Валидация Telegram данных (упрощенная версия)
    // В production нужно проверять hash через Telegram Bot API
    // Пример: https://core.telegram.org/widgets/login#checking-authorization
    return this.authService.telegramLogin(telegramData)
  }

  @Post('verify-contact')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyContact(@Request() req, @Body() verifyCodeDto: VerifyCodeDto) {
    await this.verificationService.verifyCode(
      verifyCodeDto.identifier,
      verifyCodeDto.code,
      verifyCodeDto.type
    )
    const user = await this.authService.verifyUserContact(req.user.id, verifyCodeDto.type)
    return { message: 'Контакт подтвержден', user }
  }
}
