import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { DiscordModule } from '../discord/discord.module';

@Module({
  imports: [DiscordModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
