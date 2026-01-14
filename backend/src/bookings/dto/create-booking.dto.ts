import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator'

export class CreateBookingDto {
  @IsString()
  listingId: string

  @IsDateString()
  checkIn: string

  @IsDateString()
  checkOut: string

  @IsNumber()
  @Min(1)
  guests: number

  @IsOptional()
  @IsString()
  message?: string
}
