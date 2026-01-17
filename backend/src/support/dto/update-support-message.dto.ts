import { IsString, IsEnum, IsOptional } from 'class-validator'
import { SupportMessageStatus } from '../entities/support-message.entity'

export class UpdateSupportMessageDto {
  @IsOptional()
  @IsEnum(SupportMessageStatus)
  status?: SupportMessageStatus

  @IsOptional()
  @IsString()
  adminResponse?: string
}
