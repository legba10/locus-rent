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
import { Listing } from '../../listings/entities/listing.entity'

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'userId' })
  user: User

  @Column()
  userId: string

  @ManyToOne(() => Listing, (listing) => listing.bookings)
  @JoinColumn({ name: 'listingId' })
  listing: Listing

  @Column()
  listingId: string

  @Column('date')
  checkIn: Date

  @Column('date')
  checkOut: Date

  @Column('integer')
  guests: number

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus

  @Column('text', { nullable: true })
  message: string

  @Column('jsonb', { nullable: true })
  paymentInfo: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
