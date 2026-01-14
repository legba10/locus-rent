import { IsString, IsNotEmpty, IsEnum } from 'class-validator'
import { VerificationType } from '../entities/verification-code.entity'

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  identifier: string // email или телефон

  @IsString()
  @IsNotEmpty()
  code: string

  @IsEnum(VerificationType)
  type: VerificationType
}
