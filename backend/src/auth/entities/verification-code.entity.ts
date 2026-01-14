import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

export enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
}

@Entity('verification_codes')
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  identifier: string // email или телефон

  @Column({
    type: 'enum',
    enum: VerificationType,
  })
  type: VerificationType

  @Column()
  code: string

  @Column({ default: false })
  used: boolean

  @Column({ type: 'timestamp' })
  expiresAt: Date

  @Column({ default: 0 })
  attempts: number

  @CreateDateColumn()
  createdAt: Date
}
