import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import qs from 'qs';
import { ShiftAxiosClient } from '../../shared/http/axios-client.factory';
import { SessionManagerService } from './session-manager.service';
import { PlatformsEnum } from '../types/platforms.enum';
import { ErrorsShift } from '../types/errors.enum';
import { SuccessShift } from '../types/succes.enum';
import { SHIFT_HEADERS } from '../constants/api.constants';
import type { RedemptionResult } from '../interfaces/shift-session.interface';
import { NotificationService } from '../../notification/services/notification.service';
import { ShiftRewardsService } from './shift-rewards.service';

@Injectable()
export class ShiftRedemptionService {
  private readonly logger = new Logger(ShiftRedemptionService.name);

  constructor(
    private readonly shiftAxiosClient: ShiftAxiosClient,
    private readonly sessionManager: SessionManagerService,
    private readonly notificationService: NotificationService,
    private readonly shiftRewardsService: ShiftRewardsService,
  ) {}

  async redeemCode(code: string, platform: PlatformsEnum): Promise<any> {
    try {
      const res = await this.shiftAxiosClient.post(
        '/code_redemptions',
        qs.stringify({
          utf8: '✓',
          authenticity_token: this.sessionManager.getAuthenticityTokenModal(),
          'archway_code_redemption[code]': code,
          'archway_code_redemption[check]':
            this.sessionManager.getArchwayCodeRedemption(),
          'archway_code_redemption[service]': platform,
          'archway_code_redemption[title]': 'oak2',
        }),
        {
          headers: {
            Cookie: this.sessionManager.getCookieJar(),
            'X-CSRF-Token': this.sessionManager.getCsrfToken(),
            'X-Requested-With': SHIFT_HEADERS.X_REQUESTED_WITH,
            'Content-Type': SHIFT_HEADERS.CONTENT_TYPE,
            Accept: SHIFT_HEADERS.ACCEPT,
            Referer: SHIFT_HEADERS.REFERER,
            Origin: SHIFT_HEADERS.ORIGIN,
          },
          maxRedirects: 0,
        },
      );

      const location = res.headers['location'] as string;

      const jobId = location.split('/').at(-1);

      const responseData = await this.pollRedemptionStatus(jobId!);
      return responseData;
    } catch (error) {
      this.logger.error('Error redeeming code:', error.message);
      throw new InternalServerErrorException('Failed to redeem code');
    }
  }

  async pollRedemptionStatus(jobId: string): Promise<RedemptionResult> {
    for (let i = 0; i < 10; i++) {
      const res = await this.shiftAxiosClient.get(
        `/code_redemptions/${jobId}`,
        {
          headers: {
            Cookie: this.sessionManager.getCookieJar(),
            'X-CSRF-Token': this.sessionManager.getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
          },
          maxRedirects: 0,
        },
      );

      const data = res.data;

      // Ya es JSON con el resultado
      if (
        data?.text === SuccessShift.SUCCESS ||
        data?.text === ErrorsShift.REDEEMED
      ) {
        return data as RedemptionResult;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error('Timeout esperando resultado del canje');
  }

  async redeemAllCodes(): Promise<void> {
    const codes = this.sessionManager.getValidatedCodes();
    const platforms = this.sessionManager.getPlatforms();

    for (const codeObj of codes) {
      await this.shiftRewardsService.checkEntitlementOfferCode(codeObj.code);
      for (const platform of platforms) {
        const result = await this.redeemCode(codeObj.code, platform);
        this.handleRedemptionResult(codeObj.code, platform, result);
      }
    }
  }

  private async handleRedemptionResult(
    code: string,
    platform: PlatformsEnum,
    result: RedemptionResult,
  ): Promise<void> {
    if (result.text === ErrorsShift.REDEEMED) {
      this.logger.error(ErrorsShift.REDEEMED);
      await this.notificationService.notifyCodeFailed(code, platform);
    }

    if (result.text === SuccessShift.SUCCESS) {
      this.logger.debug(`Code redeemed: ${code} on ${platform}`);
      await this.notificationService.notifyCodeRedeemed(code, platform);
    }
  }
}
