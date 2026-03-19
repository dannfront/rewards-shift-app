import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShiftModule } from './modules/shift/shift.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RedditModule } from './modules/reddit/reddit.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { DiscordModule } from './modules/discord/discord.module';

@Module({
  imports: [
    ShiftModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    RedditModule,
    CronJobModule,
    DiscordModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
