import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShiftService } from '../shift/services/shift.service';
import { RedditService } from '../reddit/reddit.service';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly shiftService: ShiftService,
    private readonly redditService: RedditService,
  ) {}

  //todo activar el cron
  async handleCron() {
    this.logger.log('Iniciando el trabajo por lotes');
    const posts = await this.redditService.fetchRedditPosts();
    await this.shiftService.redeemAllCodes(posts);
    this.logger.log('Trabajo por lotes finalizado');
  }
}
