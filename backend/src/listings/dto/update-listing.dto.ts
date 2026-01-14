import { IsOptional, IsString, IsNumber, IsEnum, IsArray, IsBoolean } from 'class-validator'
import { CreateListingDto } from './create-listing.dto'
import { ListingStatus, ListingType } from '../entities/listing.entity'

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus

  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsNumber()
  latitude?: number

  @IsOptional()
  @IsNumber()
  longitude?: number

  @IsOptional()
  @IsNumber()
  pricePerNight?: number

  @IsOptional()
  @IsNumber()
  maxGuests?: number

  @IsOptional()
  @IsNumber()
  bedrooms?: number

  @IsOptional()
  @IsNumber()
  beds?: number

  @IsOptional()
  @IsNumber()
  bathrooms?: number

  @IsOptional()
  @IsArray()
  amenities?: string[]

  @IsOptional()
  @IsArray()
  images?: string[]
}
