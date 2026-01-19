import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsLatitude,
  IsLongitude,
  Min,
  Max,
} from 'class-validator'
import { ListingStatus, ListingType } from '../entities/listing.entity'
import { IsSafeImageUrl } from '../../common/validators/is-safe-image-url.validator'

export class CreateListingDto {
  @IsString()
  title: string

  @IsString()
  description: string

  @IsOptional()
  @IsArray()
  @IsSafeImageUrl({ each: true })
  images: string[] = []

  @IsEnum(ListingType)
  type: ListingType

  @IsString()
  city: string

  @IsOptional()
  @IsString()
  district?: string

  @IsString()
  address: string

  @IsOptional()
  @IsLatitude()
  latitude?: number

  @IsOptional()
  @IsLongitude()
  longitude?: number

  @IsNumber()
  @Min(0)
  pricePerNight: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerWeek?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerMonth?: number

  @IsNumber()
  @Min(1)
  @Max(20)
  maxGuests: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  beds?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  bathrooms?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[]

  @IsOptional()
  houseRules?: string

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus
}
