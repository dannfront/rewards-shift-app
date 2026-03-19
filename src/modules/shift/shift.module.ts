import { Module } from '@nestjs/common';
import { ShiftService } from './services/shift.service';
import { ShiftAuthService } from './services/shift-auth.service';
import { ShiftRewardsService } from './services/shift-rewards.service';
import { ShiftRedemptionService } from './services/shift-redemption.service';
import { SessionManagerService } from './services/session-manager.service';
import {
  AxiosClientFactory,
  ShiftAxiosClient,
} from '../shared/http/axios-client.factory';
import { NotificationModule } from '../notification/notification.module';

@Module({
  providers: [
    ShiftService,
    ShiftAuthService,
    ShiftRewardsService,
    ShiftRedemptionService,
    SessionManagerService,
    AxiosClientFactory,
    ShiftAxiosClient,
  ],
  exports: [ShiftService],
  imports: [NotificationModule],
})
export class ShiftModule {}
