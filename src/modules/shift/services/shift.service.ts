import { Injectable, Logger } from '@nestjs/common';
import { ShiftAuthService } from './shift-auth.service';
import { ShiftRewardsService } from './shift-rewards.service';
import { ShiftRedemptionService } from './shift-redemption.service';
import { SessionManagerService } from './session-manager.service';
import { SimpleReddit } from '../../reddit/interfaces/simple-reddit.interface';

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    private readonly shiftAuthService: ShiftAuthService,
    private readonly shiftRewardsService: ShiftRewardsService,
    private readonly shiftRedemptionService: ShiftRedemptionService,
    private readonly sessionManager: SessionManagerService,
  ) {}

  async redeemAllCodes(redditPosts: SimpleReddit[]): Promise<void> {
    this.logger.log('Starting code redemption process');
    this.sessionManager.initialize();

    await this.shiftAuthService.login();
    await this.shiftRewardsService.fetchRewardsPage();

    const allKeys = this.extractAllKeys(redditPosts);
    await this.shiftRewardsService.validateCodes(allKeys);

    await this.shiftRedemptionService.redeemAllCodes();

    this.logger.log('Code redemption process completed');
  }

  private extractAllKeys(redditPosts: SimpleReddit[]): string[] {
    const keys: string[] = [];
    for (const post of redditPosts) {
      keys.push(...post.keys);
    }
    return keys;
  }
}
