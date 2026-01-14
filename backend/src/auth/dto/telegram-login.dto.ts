import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator'

export class TelegramLoginDto {
  @IsNumber()
  @IsNotEmpty()
  id: number

  @IsString()
  @IsNotEmpty()
  first_name: string

  @IsOptional()
  @IsString()
  last_name?: string

  @IsOptional()
  @IsString()
  username?: string

  @IsOptional()
  @IsString()
  photo_url?: string

  @IsNumber()
  @IsNotEmpty()
  auth_date: number

  @IsString()
  @IsNotEmpty()
  hash: string
}
