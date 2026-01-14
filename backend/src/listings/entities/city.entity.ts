import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

@Entity('cities')
@Index(['name'])
@Index(['country', 'name'])
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ default: 'RU' })
  country: string

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number

  @Column({ nullable: true })
  region: string

  @Column({ default: 0 })
  listingsCount: number

  @CreateDateColumn()
  createdAt: Date
}
