import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

/**
 * Персональные предпочтения пользователя
 * Используются для персонализации рекомендаций
 */
@Entity('user_preferences')
export class UserPreference {
  @PrimaryColumn()
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User

  /**
   * Предпочтения в JSON формате
   */
  @Column('jsonb', { default: {} })
  preferences: {
    // Приоритеты (0-1, где 1 - максимальный приоритет)
    priorities?: {
      quiet?: number // Тишина
      center?: number // Центр города
      comfort?: number // Комфорт
      price?: number // Цена
      quality?: number // Качество
    }
    // Предпочтения по типу жилья
    preferredHousingTypes?: string[]
    // Предпочтения по районам
    preferredDistricts?: string[]
    // Избегаемые районы
    avoidedDistricts?: string[]
    // Бюджетные предпочтения
    budgetRange?: {
      min?: number
      max?: number
    }
    // Другие предпочтения
    [key: string]: any
  }

  /**
   * История предпочтений (для обучения модели)
   */
  @Column('jsonb', { nullable: true })
  history?: Array<{
    timestamp: Date
    preferences: Record<string, any>
  }>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
