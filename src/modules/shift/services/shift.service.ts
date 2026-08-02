import { Injectable, Logger } from '@nestjs/common';
import { ShiftAuthService } from './shift-auth.service';
import { ShiftRewardsService } from './shift-rewards.service';
import { ShiftRedemptionService } from './shift-redemption.service';
import { SessionManagerService } from './session-manager.service';
import { ShiftCode } from '../../shift-code/interfaces/shift-code.interface';

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    private readonly shiftAuthService: ShiftAuthService,
    private readonly shiftRewardsService: ShiftRewardsService,
    private readonly shiftRedemptionService: ShiftRedemptionService,
    private readonly sessionManager: SessionManagerService,
  ) {}

  async redeemAllCodes(shiftCodes: ShiftCode[]): Promise<void> {
    this.logger.log('Starting code redemption process');
    this.sessionManager.initialize();

    await this.shiftAuthService.login();
    await this.shiftRewardsService.fetchRewardsPage();

    const allKeys = shiftCodes.map((c) => c.code);
    await this.shiftRewardsService.validateCodes(allKeys);

    await this.shiftRedemptionService.redeemAllCodes();

    this.logger.log('Code redemption process completed');
  }
}
