import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { INotificationService } from '../interfaces/notification.interface';

const COLOR_GREEN = 0x57f287;
const COLOR_ORANGE = 0xe67e22;
const COLOR_RED = 0xed4245;

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly webhookUrl: string | undefined;

  constructor(configService: ConfigService) {
    this.webhookUrl = configService.get<string>('DISCORD_WEBHOOK_URL');
    if (!this.webhookUrl) {
      this.logger.error('DISCORD_WEBHOOK_URL not configured; notifications will be skipped');
    }
  }

  async notifyCodeRedeemed(code: string, platform: string): Promise<void> {
    await this.sendEmbed(
      COLOR_GREEN,
      `Code redeemed: ${code} on platform: ${platform}`,
    );
  }

  async notifyCodeFailed(code: string, platform: string): Promise<void> {
    await this.sendEmbed(
      COLOR_ORANGE,
      `Code not redeemed: ${code} on platform: ${platform}`,
    );
  }

  async notifyCodeExpired(code: string): Promise<void> {
    await this.sendEmbed(COLOR_RED, `Code expired: ${code}`);
  }

  private async sendEmbed(color: number, description: string): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }
    try {
      await axios.post(this.webhookUrl, {
        embeds: [{ color, description }],
      });
    } catch (error) {
      this.logger.error('Error sending Discord webhook:', error);
    }
  }
}
