import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { ShiftModule } from '../shift/shift.module';
import { RedditModule } from '../reddit/reddit.module';

@Module({
  providers: [CronJobService],
  imports: [ShiftModule, RedditModule],
})
export class CronJobModule {}
