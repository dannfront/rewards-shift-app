import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { ShiftModule } from '../shift/shift.module';
import { ShiftCodeModule } from '../shift-code/shift-code.module';

@Module({
  providers: [CronJobService],
  imports: [ShiftModule, ShiftCodeModule],
})
export class CronJobModule {}
