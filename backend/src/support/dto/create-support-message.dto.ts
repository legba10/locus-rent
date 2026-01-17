import { IsString, IsOptional, IsEmail } from 'class-validator'

export class CreateSupportMessageDto {
  @IsString()
  name: string

  @IsString()
  phone: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  message: string
}
