import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Агрегированное объявление в едином формате
 * Хранит нормализованные данные из всех источников
 */
@Entity('aggregated_listings')
export class AggregatedListing {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  source: string // 'locus', 'avito', 'sutochno', etc.

  @Column({ nullable: true })
  @Index()
  externalId: string | null

  @Column('jsonb')
  normalizedData: Record<string, any> // UnifiedListing в JSON формате

  /**
   * Trust score (0-1)
   * Вычисляется Scoring Engine на основе множества факторов
   */
  @Column('decimal', { precision: 3, scale: 2, default: 0.5 })
  @Index()
  trustScore: number

  /**
   * Хеш для дедупликации объявлений
   * Объявления с одинаковым хешом считаются дубликатами
   */
  @Column()
  @Index()
  deduplicationHash: string

  /**
   * Флаг подозрительного объявления (антифрод)
   */
  @Column({ default: false })
  @Index()
  isSuspicious: boolean

  /**
   * Флаг скрытого объявления (не показывать пользователям)
   */
  @Column({ default: false })
  @Index()
  isHidden: boolean

  /**
   * Дата последнего обновления из источника
   */
  @Column('timestamp')
  lastSourceUpdate: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
