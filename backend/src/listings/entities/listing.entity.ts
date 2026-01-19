import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Booking } from '../../bookings/entities/booking.entity'
import { Review } from '../../reviews/entities/review.entity'

export enum ListingType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  STUDIO = 'studio',
  ROOM = 'room',
}

export enum ListingStatus {
  DRAFT = 'draft',
  PENDING_MODERATION = 'pending_moderation',
  MODERATION = 'moderation', // Для обратной совместимости
  APPROVED = 'approved',
  ACTIVE = 'active', // Для обратной совместимости
  NEEDS_REVISION = 'needs_revision',
  REJECTED = 'rejected',
  HIDDEN = 'hidden',
}

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column('text')
  description: string

  @Column('simple-array', { nullable: true, default: [] })
  images: string[] = []

  @Column({
    type: 'enum',
    enum: ListingType,
  })
  type: ListingType

  @Column()
  city: string

  @Column({ nullable: true })
  district: string

  @Column()
  address: string

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerNight: number

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  pricePerWeek: number

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  pricePerMonth: number

  @Column()
  maxGuests: number

  @Column('integer', { default: 0 })
  bedrooms: number

  @Column('integer', { default: 0 })
  beds: number

  @Column('integer', { default: 1 })
  bathrooms: number

  @Column('simple-array', { nullable: true })
  amenities: string[]

  @Column('jsonb', { nullable: true })
  availability: Record<string, any>

  @Column('text', { nullable: true })
  houseRules: string

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  status: ListingStatus

  @Column('text', { nullable: true })
  revisionReason: string

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  rating: number

  @Column('integer', { default: 0 })
  reviewsCount: number

  @ManyToOne(() => User, (user) => user.listings)
  @JoinColumn({ name: 'ownerId' })
  owner: User

  @Column()
  ownerId: string

  @OneToMany(() => Booking, (booking) => booking.listing)
  bookings: Booking[]

  @OneToMany(() => Review, (review) => review.listing)
  reviews: Review[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
