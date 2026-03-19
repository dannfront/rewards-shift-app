import { Injectable, Logger } from '@nestjs/common';
import { DiscordService } from '../../discord/discord.service';
import { INotificationService } from '../interfaces/notification.interface';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly discordService: DiscordService) {}

  async notifyCodeRedeemed(code: string, platform: string): Promise<void> {
    try {
      await this.discordService.sendCodeRedeemed(code, platform);
    } catch (error) {
      this.logger.error('Error notifying code redeemed:', error);
    }
  }

  async notifyCodeFailed(code: string, platform: string): Promise<void> {
    try {
      await this.discordService.sendCodeNotRedeemed(code, platform);
    } catch (error) {
      this.logger.error('Error notifying code failed:', error);
    }
  }

  async notifyCodeExpired(code: string): Promise<void> {
    try {
      await this.discordService.sendCodeExpired(code);
    } catch (error) {
      this.logger.error('Error notifying code expired:', error);
    }
  }
}
