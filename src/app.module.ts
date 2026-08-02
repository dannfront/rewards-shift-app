import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShiftModule } from './modules/shift/shift.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ShiftCodeModule } from './modules/shift-code/shift-code.module';
import { CronJobModule } from './modules/cron-job/cron-job.module';
import { DiscordModule } from './modules/discord/discord.module';

@Module({
  imports: [
    ShiftModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    ShiftCodeModule,
    CronJobModule,
    DiscordModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
