import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookClient, EmbedBuilder } from 'discord.js';

@Injectable()
export class DiscordService {
  private logger = new Logger(DiscordService.name);
  private readonly webhookClient: WebhookClient;
  private readonly embedBuilder: EmbedBuilder;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('DISCORD_WEBHOOK_URL');
    if (!url) {
      this.logger.error('DISCORD_WEBHOOK_URL not found');
      return;
    }
    this.webhookClient = new WebhookClient({
      url,
    });

    this.embedBuilder = new EmbedBuilder();
  }

  async sendCodeRedeemed(code: string, platform: string) {
    try {
      await this.webhookClient.send({
        embeds: [
          this.embedBuilder
            .setColor('Green')
            .setDescription(`Code redeemed: ${code} on platform: ${platform}`),
        ],
      });
    } catch (error) {
      this.logger.error('Error sending code redeemed:', error);
    }
  }

  async sendCodeNotRedeemed(code: string, platform: string) {
    try {
      await this.webhookClient.send({
        embeds: [
          this.embedBuilder
            .setColor('Orange')
            .setDescription(
              `Code not redeemed: ${code} on platform: ${platform}`,
            ),
        ],
      });
    } catch (error) {
      this.logger.error('Error sending code not redeemed:', error);
    }
  }

  async sendCodeExpired(code: string) {
    try {
      await this.webhookClient.send({
        embeds: [
          this.embedBuilder
            .setColor('Red')
            .setDescription(`Code expired: ${code}`),
        ],
      });
    } catch (error) {
      this.logger.error('Error sending code expired:', error);
    }
  }
}
