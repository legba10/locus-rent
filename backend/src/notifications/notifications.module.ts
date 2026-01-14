import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { TelegramModule } from '../telegram/telegram.module'

@Module({
  imports: [TelegramModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
