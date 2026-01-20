import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

// Загружаем переменные окружения из backend/.env
dotenv.config({ path: '.env' })

const databaseUrl = process.env.DATABASE_URL?.trim()

if (!databaseUrl) {
  throw new Error(
    '❌ DATABASE_URL is not set in environment variables. ' +
      'Please set DATABASE_URL in backend/.env file. ' +
      'Get your connection string from Neon: https://neon.tech'
  )
}

let url: URL
try {
  url = new URL(databaseUrl)
} catch {
  throw new Error(
    '❌ Invalid DATABASE_URL format. ' +
      'Expected format: postgresql://user:password@host/dbname?sslmode=require'
  )
}

// Убеждаемся, что sslmode=require присутствует — это критично для Neon
if (!url.searchParams.has('sslmode')) {
  url.searchParams.set('sslmode', 'require')
}

const finalUrl = url.toString()

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: finalUrl,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
})

