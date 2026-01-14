import { IsString, IsNotEmpty, IsEnum, IsEmail, Matches } from 'class-validator'
import { VerificationType } from '../entities/verification-code.entity'

export class SendCodeDto {
  @IsEnum(VerificationType)
  type: VerificationType

  @IsString()
  @IsNotEmpty()
  identifier: string // email или телефон
}
