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

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User

  @Column()
  userId: string

  @ManyToOne(() => Listing, (listing) => listing.reviews)
  @JoinColumn({ name: 'listingId' })
  listing: Listing

  @Column()
  listingId: string

  @Column('integer')
  rating: number

  @Column('text', { nullable: true })
  comment: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
