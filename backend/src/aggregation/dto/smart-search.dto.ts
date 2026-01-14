import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class BudgetDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number
}

class PrioritiesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  quiet?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  center?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  comfort?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  price?: number
}

class CoordinatesDto {
  @IsNumber()
  lat: number

  @IsNumber()
  lng: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number
}

export class SmartSearchDto {
  @IsEnum(['work', 'leisure', 'urgent'])
  tripPurpose: 'work' | 'leisure' | 'urgent'

  @IsDateString()
  checkIn: string

  @IsDateString()
  checkOut: string

  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetDto)
  budget?: BudgetDto

  @IsOptional()
  @ValidateNested()
  @Type(() => PrioritiesDto)
  priorities?: PrioritiesDto

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto
}
