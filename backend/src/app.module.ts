import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ListingsModule } from './listings/listings.module'
import { BookingsModule } from './bookings/bookings.module'
import { ReviewsModule } from './reviews/reviews.module'
import { NotificationsModule } from './notifications/notifications.module'
import { AdminModule } from './admin/admin.module'
import { TelegramModule } from './telegram/telegram.module'
import { RecommendationModule } from './recommendation/recommendation.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL?.trim()

        if (!databaseUrl) {
          throw new Error(
            '❌ DATABASE_URL is not set in environment variables. ' +
            'Please set DATABASE_URL in backend/.env file. ' +
            'Get your connection string from Neon: https://neon.tech'
          )
        }

        // Проверка, что используется Neon (не localhost)
        const isLocalhost = databaseUrl.includes('localhost') || 
                           databaseUrl.includes('127.0.0.1') ||
                           databaseUrl.match(/postgresql:\/\/.*@localhost/) ||
                           databaseUrl.match(/postgresql:\/\/.*@127\.0\.0\.1/)

        if (isLocalhost) {
          throw new Error(
            '❌ Local PostgreSQL is not allowed. ' +
            'This project uses Neon PostgreSQL (cloud database). ' +
            'Please get your connection string from https://neon.tech and update DATABASE_URL in backend/.env'
          )
        }

        // Парсинг URL для добавления SSL параметров
        let url: URL
        try {
          url = new URL(databaseUrl)
        } catch (error) {
          throw new Error(
            '❌ Invalid DATABASE_URL format. ' +
            'Expected format: postgresql://user:password@host/dbname?sslmode=require'
          )
        }
        
        // Убеждаемся, что sslmode=require присутствует
        if (!url.searchParams.has('sslmode')) {
          url.searchParams.set('sslmode', 'require')
        }

        const finalUrl = url.toString()

        return {
          type: 'postgres',
          url: finalUrl,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
          ssl: {
            rejectUnauthorized: false, // Neon использует валидные сертификаты
          },
          extra: {
            // Поддержка Neon connection pooling
            max: 20, // Максимум соединений в пуле
            connectionTimeoutMillis: 10000, // Таймаут подключения
          },
        }
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    ListingsModule,
    BookingsModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
    TelegramModule,
    RecommendationModule,
  ],
})
export class AppModule {}
