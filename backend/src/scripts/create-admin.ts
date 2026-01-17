import { DataSource } from 'typeorm'
import { User, UserRole } from '../users/entities/user.entity'
import * as bcrypt from 'bcrypt'

async function createAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await dataSource.initialize()
    console.log('✅ Database connected')

    const usersRepository = dataSource.getRepository(User)

    // Проверяем, существует ли уже администратор
    const existingAdmin = await usersRepository.findOne({
      where: { email: 'feodal.00@bk.ru' },
    })

    if (existingAdmin) {
      // Обновляем существующего пользователя до администратора
      existingAdmin.role = UserRole.ADMIN
      existingAdmin.isActive = true
      await usersRepository.save(existingAdmin)
      console.log('✅ Admin user updated:', existingAdmin.email)
    } else {
      // Создаём нового администратора
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      const admin = usersRepository.create({
        email: 'feodal.00@bk.ru',
        firstName: 'Admin',
        lastName: 'LOCUS',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true,
      })

      await usersRepository.save(admin)
      console.log('✅ Admin user created:', admin.email)
      console.log('📧 Email: feodal.00@bk.ru')
      console.log('🔑 Password: admin123')
      console.log('⚠️  Please change the password after first login!')
    }

    await dataSource.destroy()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    await dataSource.destroy()
    process.exit(1)
  }
}

createAdmin()
