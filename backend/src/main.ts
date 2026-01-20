import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { DataSource } from 'typeorm'
import * as express from 'express'
import * as path from 'path'
import { UsersService } from './users/users.service'
import { UserRole } from './users/entities/user.entity'
import * as bcrypt from 'bcrypt'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  // Проверка DATABASE_URL перед запуском
  const databaseUrl = process.env.DATABASE_URL?.trim()
  
  if (!databaseUrl) {
    logger.error('❌ DATABASE_URL is not set!')
    logger.error('Please set DATABASE_URL in backend/.env file')
    logger.error('Get your connection string from Neon: https://neon.tech')
    process.exit(1)
  }

  // Логирование для отладки (только первый раз)
  logger.log(`🔍 Checking DATABASE_URL...`)
  logger.log(`   Length: ${databaseUrl.length} characters`)
  logger.log(`   Starts with: ${databaseUrl.substring(0, 30)}...`)

  // Проверка, что используется Neon (не localhost)
  const isLocalhost = databaseUrl.includes('localhost') || 
                      databaseUrl.includes('127.0.0.1') ||
                      databaseUrl.match(/postgresql:\/\/.*@localhost/) ||
                      databaseUrl.match(/postgresql:\/\/.*@127\.0\.0\.1/)

  if (isLocalhost) {
    logger.error('❌ Local PostgreSQL is not allowed!')
    logger.error(`   Detected URL: ${databaseUrl.substring(0, 50)}...`)
    logger.error('This project uses Neon PostgreSQL (cloud database)')
    logger.error('Please get your connection string from https://neon.tech')
    logger.error('Update DATABASE_URL in backend/.env')
    logger.error('')
    logger.error('Expected format: postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require')
    process.exit(1)
  }

  // Проверка, что это Neon URL
  const isNeon = databaseUrl.includes('neon.tech') || databaseUrl.includes('ep-')
  if (!isNeon) {
    logger.warn('⚠️  WARNING: DATABASE_URL does not look like a Neon connection string')
    logger.warn('   Expected: postgresql://...@ep-xxx-xxx.region.aws.neon.tech/...')
  } else {
    logger.log('✅ DATABASE_URL looks like Neon PostgreSQL')
  }

  try {
    const app = await NestFactory.create(AppModule)

    // Проверка подключения к БД
    try {
      const dataSource = app.get(DataSource)
      if (dataSource.isInitialized) {
        await dataSource.query('SELECT 1')
        logger.log('✅ Database connection established (Neon PostgreSQL)')
      } else {
        logger.warn('⚠️  Database connection not yet initialized (will be initialized on first use)')
      }
    } catch (dbError) {
      logger.error('❌ Failed to connect to database:', dbError.message)
      throw dbError
    }

    // CORS
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true)
          return
        }
        const allowedOrigins = [
          /^https:\/\/.*\.vercel\.app$/,
          'http://localhost:3000',
          'http://localhost:3001',
          'https://locus-rent.onrender.com',
        ]
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') {
            return origin === allowed
          }
          return allowed.test(origin)
        })
        callback(null, isAllowed)
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 204,
    })

    // Body size limits for file uploads
    app.use(express.json({ limit: '50mb' }))
    app.use(express.urlencoded({ extended: true, limit: '50mb' }))

    // Static uploads (URL-only image architecture)
    // Files are stored under backend/uploads and served as /uploads/*
    const uploadsDir = path.join(process.cwd(), 'uploads')
    app.use(
      '/uploads',
      express.static(uploadsDir, {
        maxAge: '30d',
        etag: true,
        immutable: true,
      })
    )

    // Global prefix
    app.setGlobalPrefix('api')

    // Validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    )

    // Глобальный JSON-обработчик ошибок
    app.useGlobalFilters(new AllExceptionsFilter())

    // Автоматическое создание администратора при первом запуске
    try {
      const usersService = app.get(UsersService)
      const adminEmail = process.env.ADMIN_EMAIL || 'feodal.00@bk.ru'
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
      
      const existingAdmin = await usersService.findByEmail(adminEmail)
      
      if (!existingAdmin) {
        logger.log(`👤 Creating admin user: ${adminEmail}`)
        const hashedPassword = await bcrypt.hash(adminPassword, 10)
        const newAdmin = await usersService.create({
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
          isActive: true,
          emailVerified: true,
        })
        logger.log(`✅ Admin user created successfully`)
        logger.log(`   Email: ${adminEmail}`)
        logger.log(`   Password: ${adminPassword}`)
        logger.warn(`   ⚠️  Please change the default password after first login!`)
      } else if (existingAdmin.role !== UserRole.ADMIN) {
        // Обновляем роль существующего пользователя
        logger.log(`👤 Updating user to admin: ${adminEmail}`)
        await usersService.update(existingAdmin.id, {
          role: UserRole.ADMIN,
          emailVerified: true,
        })
        logger.log(`✅ User role updated to admin`)
      } else {
        logger.log(`✅ Admin user already exists: ${adminEmail}`)
      }
    } catch (adminError) {
      logger.warn(`⚠️  Failed to create/update admin user: ${adminError.message}`)
      logger.warn(`   This is not critical, but admin features may not work`)
    }

    const port = process.env.PORT || 3001
    await app.listen(port)
    logger.log(`🚀 LOCUS Backend running on http://localhost:${port}`)
    logger.log(`📊 Database: Neon PostgreSQL (cloud)`)
  } catch (error) {
    logger.error('❌ Failed to start application', error)
    
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connection')) {
      logger.error('')
      logger.error('🔍 Database connection failed!')
      logger.error('Possible issues:')
      logger.error('  1. DATABASE_URL is incorrect')
      logger.error('  2. Neon database is not accessible')
      logger.error('  3. SSL certificate issue')
      logger.error('')
      logger.error('💡 Solution:')
      logger.error('  1. Check your DATABASE_URL in backend/.env')
      logger.error('  2. Make sure it includes ?sslmode=require')
      logger.error('  3. Verify your Neon project is active: https://console.neon.tech')
    }
    
    process.exit(1)
  }
}
bootstrap()
