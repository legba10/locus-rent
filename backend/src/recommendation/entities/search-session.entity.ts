import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Recommendation } from './recommendation.entity'

/**
 * Сессия поиска пользователя
 * Сохраняет историю поисков для персонализации
 */
@Entity('search_sessions')
export class SearchSession {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null

  @Column({ nullable: true })
  userId: string | null

  /**
   * Параметры поиска в JSON формате
   */
  @Column('jsonb')
  searchParams: {
    city?: string
    checkIn?: string
    checkOut?: string
    guests?: number
    priceRange?: {
      min?: number
      max?: number
    }
    coordinates?: {
      lat: number
      lng: number
      radius?: number
    }
    tripPurpose?: 'work' | 'leisure' | 'urgent'
    priorities?: {
      quiet?: number // 0-1
      center?: number
      comfort?: number
      price?: number
    }
  }

  /**
   * Количество найденных результатов
   */
  @Column({ default: 0 })
  resultsCount: number

  /**
   * Была ли сессия успешной (пользователь выбрал вариант)
   */
  @Column({ default: false })
  isSuccessful: boolean

  /**
   * Выбранное объявление (если было)
   */
  @Column({ nullable: true })
  selectedListingId: string | null

  @OneToMany(() => Recommendation, (rec) => rec.searchSession)
  recommendations: Recommendation[]

  @CreateDateColumn()
  createdAt: Date
}
