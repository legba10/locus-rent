import { IsOptional, IsString, IsEmail, IsEnum, IsBoolean, IsNumber } from 'class-validator'
import { UserRole } from '../entities/user.entity'

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsString()
  telegramId?: string

  @IsOptional()
  @IsString()
  avatar?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean

  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsNumber()
  latitude?: number

  @IsOptional()
  @IsNumber()
  longitude?: number
}
