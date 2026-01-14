import { IsEmail, IsOptional, IsString, IsPhoneNumber } from 'class-validator'

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsString()
  telegramId?: string
}
