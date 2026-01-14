import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { Listing } from '../../listings/entities/listing.entity'
import { Booking } from '../../bookings/entities/booking.entity'

export enum UserRole {
  USER = 'user',
  LANDLORD = 'landlord',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: true, unique: true })
  email: string

  @Column({ nullable: true, unique: true })
  phone: string

  @Column({ nullable: true })
  password: string

  @Column()
  firstName: string

  @Column({ nullable: true })
  lastName: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole

  @Column({ nullable: true })
  telegramId: string

  @Column({ nullable: true })
  avatar: string

  @Column({ type: 'jsonb', nullable: true })
  documents: Record<string, any>

  @Column({ default: true })
  isActive: boolean

  @Column({ default: false })
  emailVerified: boolean

  @Column({ default: false })
  phoneVerified: boolean

  @Column({ nullable: true })
  city: string

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number

  @OneToMany(() => Listing, (listing) => listing.owner)
  listings: Listing[]

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
