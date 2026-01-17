import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SupportMessage, SupportMessageStatus } from './entities/support-message.entity'
import { CreateSupportMessageDto } from './dto/create-support-message.dto'
import { UpdateSupportMessageDto } from './dto/update-support-message.dto'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportMessage)
    private supportMessageRepository: Repository<SupportMessage>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreateSupportMessageDto, userId?: string): Promise<SupportMessage> {
    const message = this.supportMessageRepository.create({
      ...createDto,
      userId: userId || null,
    })

    const savedMessage = await this.supportMessageRepository.save(message)

    // Отправляем уведомление администратору
    await this.notifyAdmin(savedMessage)

    return savedMessage
  }

  async findAll(status?: SupportMessageStatus): Promise<SupportMessage[]> {
    const where = status ? { status } : {}
    return this.supportMessageRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    })
  }

  async findOne(id: string): Promise<SupportMessage> {
    const message = await this.supportMessageRepository.findOne({
      where: { id },
      relations: ['user'],
    })
    if (!message) {
      throw new NotFoundException('Сообщение поддержки не найдено')
    }
    return message
  }

  async update(id: string, updateDto: UpdateSupportMessageDto): Promise<SupportMessage> {
    const message = await this.findOne(id)
    Object.assign(message, updateDto)
    return this.supportMessageRepository.save(message)
  }

  async remove(id: string): Promise<void> {
    const message = await this.findOne(id)
    await this.supportMessageRepository.remove(message)
  }

  private async notifyAdmin(message: SupportMessage): Promise<void> {
    // Убрали email-уведомления - все сообщения теперь только в админ-панели
    // Сообщения сохраняются в БД и отображаются в админ-панели
    console.log(`New support message from ${message.name} (${message.phone})`)
  }
}
