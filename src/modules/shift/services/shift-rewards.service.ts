import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import qs from 'qs';
import { ShiftAxiosClient } from '../../shared/http/axios-client.factory';
import { SessionManagerService } from './session-manager.service';
import { SHIFT_REGEX } from '../constants/regex.constants';
import { ErrorsShift } from '../types/errors.enum';
import { getPlatforms } from '../utils/get-platforms.util';
import { PlatformsEnum } from '../types/platforms.enum';
import { NotificationService } from '../../notification/services/notification.service';

@Injectable()
export class ShiftRewardsService {
  private readonly logger = new Logger(ShiftRewardsService.name);

  constructor(
    private readonly shiftAxiosClient: ShiftAxiosClient,
    private readonly sessionManager: SessionManagerService,
    private readonly notificationService: NotificationService,
  ) {}

  async fetchRewardsPage(): Promise<void> {
    try {
      const res = await this.shiftAxiosClient.get('/rewards', {
        headers: {
          Cookie: this.sessionManager.getCookieJar(),
        },
      });

      const data = res.data as string;

      const csrfToken = this.extractCsrfToken(data);
      this.sessionManager.setCsrfToken(csrfToken);

      this.sessionManager.updateCookies(res.headers['set-cookie']);
    } catch (error) {
      this.logger.error('Error fetching rewards page:', error);
      throw new InternalServerErrorException('Failed to fetch rewards page');
    }
  }

  async checkEntitlementOfferCode(code: string): Promise<string> {
    try {
      const res = await this.shiftAxiosClient.get('/entitlement_offer_codes', {
        headers: {
          Cookie: this.sessionManager.getCookieJar(),
          'X-CSRF-Token': this.sessionManager.getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        params: { code },
      });

      const data = res.data as string;
      if (data?.includes(ErrorsShift.EXPIRED)) {
        this.logger.error(`Code expired: ${code}`);
        await this.notificationService.notifyCodeExpired(code);
        return data;
      }

      this.extractModalTokens(data);
      return data;
    } catch (error) {
      this.logger.error(
        'Error checking entitlement offer code:',
        error.message,
      );
      throw new InternalServerErrorException(
        'Failed to check entitlement offer code',
      );
    }
  }

  async validateCodes(codes: string[]): Promise<void> {
    this.sessionManager.resetValidatedCodes();
    let platforms: PlatformsEnum[] | null = null;

    for (const code of codes) {
      const codeData = await this.checkEntitlementOfferCode(code);

      if (!codeData.includes(ErrorsShift.EXPIRED)) {
        this.sessionManager.addValidatedCode(code, true);

        if (!platforms) {
          platforms = getPlatforms(codeData);
          this.sessionManager.setPlatforms(platforms);
        }
      }
    }
  }

  private extractCsrfToken(data: string): string {
    const match = data.match(SHIFT_REGEX.CSRF_TOKEN);
    if (!match || !match[1]) {
      throw new InternalServerErrorException('Could not extract CSRF token');
    }
    return match[1];
  }

  private extractModalTokens(data: string): void {
    const authenticityTokenMatch = data.match(SHIFT_REGEX.AUTHENTICITY_TOKEN);
    const archwayCheckMatch = data.match(SHIFT_REGEX.ARCHWAY_CHECK);
    const archwayTitleMatch = data.match(SHIFT_REGEX.ARCHWAY_TITLE);

    if (authenticityTokenMatch?.[1]) {
      this.sessionManager.setAuthenticityTokenModal(authenticityTokenMatch[1]);
    }
    if (archwayCheckMatch?.[1]) {
      this.sessionManager.setArchwayCodeRedemption(
        archwayCheckMatch[1],
        archwayTitleMatch?.[1] ?? '',
      );
    }
  }
}
