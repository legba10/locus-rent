import { IsOptional, IsString, IsNumber, IsEnum, IsLatitude, IsLongitude, Min } from 'class-validator'
import { ListingType } from '../entities/listing.entity'

export class SearchListingsDto {
  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsLatitude()
  latitude?: number

  @IsOptional()
  @IsLongitude()
  longitude?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  guests?: number

  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType

  @IsOptional()
  @IsString()
  checkIn?: string

  @IsOptional()
  @IsString()
  checkOut?: string
}
