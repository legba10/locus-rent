import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { SearchSession } from './search-session.entity'

/**
 * Рекомендация для пользователя
 * Сохраняет лучшие варианты для конкретной сессии поиска
 */
@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => SearchSession, (session) => session.recommendations)
  @JoinColumn({ name: 'searchSessionId' })
  searchSession: SearchSession

  @Column()
  searchSessionId: string

  /**
   * ID рекомендованных объявлений (массив)
   */
  @Column('simple-array')
  listingIds: string[]

  /**
   * Объяснение рекомендации в JSON формате
   * Почему именно эти варианты были выбраны
   */
  @Column('jsonb')
  explanation: {
    primaryReason: string
    factors: Array<{
      name: string
      score: number
      description: string
    }>
    comparison?: {
      priceVsMarket: 'lower' | 'average' | 'higher'
      locationScore: number
      qualityScore: number
    }
  }

  /**
   * Итоговый score рекомендации (0-1)
   */
  @Column('decimal', { precision: 3, scale: 2 })
  score: number

  @CreateDateColumn()
  createdAt: Date
}
