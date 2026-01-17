import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator'
import { UserRole } from '../entities/user.entity'

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  password?: string

  @IsString()
  firstName: string

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
  emailVerified?: boolean

  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  city?: string

  @IsOptional()
  latitude?: number

  @IsOptional()
  longitude?: number
}
