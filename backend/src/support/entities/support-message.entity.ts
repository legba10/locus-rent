import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

export enum SupportMessageStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  phone: string

  @Column('text', { nullable: true })
  description: string

  @Column('text')
  message: string

  @Column({
    type: 'enum',
    enum: SupportMessageStatus,
    default: SupportMessageStatus.NEW,
  })
  status: SupportMessageStatus

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column({ nullable: true })
  userId: string

  @Column({ nullable: true })
  adminResponse: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
