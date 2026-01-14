import { IsEmail, IsOptional, IsString, MinLength, Matches } from 'class-validator'

export class RegisterDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email должен быть в правильном формате' })
  email?: string

  @IsOptional()
  @Matches(/^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/, {
    message: 'Телефон должен быть в формате +7 (999) 123-45-67 или 79991234567'
  })
  phone?: string

  @IsString({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string

  @IsString({ message: 'Имя обязательно' })
  firstName: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsString()
  telegramId?: string
}
