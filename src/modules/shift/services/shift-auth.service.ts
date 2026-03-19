import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import qs from 'qs';
import { ShiftAxiosClient } from '../../shared/http/axios-client.factory';
import { SessionManagerService } from './session-manager.service';
import { SHIFT_REGEX } from '../constants/regex.constants';

@Injectable()
export class ShiftAuthService {
  private readonly logger = new Logger(ShiftAuthService.name);

  constructor(
    private readonly shiftAxiosClient: ShiftAxiosClient,
    private readonly sessionManager: SessionManagerService,
    private readonly configService: ConfigService,
  ) {}

  async fetchHomePage(): Promise<string> {
    try {
      const res = await this.shiftAxiosClient.get('/home');
      const data = res.data as string;
      const authenticityToken = this.extractAuthenticityToken(data);
      this.sessionManager.setAuthenticityTokenHome(authenticityToken);
      this.sessionManager.updateCookies(res.headers['set-cookie']);
      return authenticityToken;
    } catch (error) {
      this.logger.error('Error fetching home page:', error);
      throw new InternalServerErrorException('Failed to fetch home page');
    }
  }

  async login(): Promise<void> {
    try {
      const authenticityToken = await this.fetchHomePage();
      const email = this.configService.get<string>('EMAIL_SHIFT');
      const password = this.configService.get<string>('PASSWORD_SHIFT');

      if (!email || !password) {
        throw new InternalServerErrorException(
          'Missing EMAIL_SHIFT or PASSWORD_SHIFT configuration',
        );
      }

      const res = await this.shiftAxiosClient.post(
        '/sessions',
        qs.stringify({
          authenticity_token: authenticityToken,
          'user[email]': email,
          'user[password]': password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: this.sessionManager.getCookieJar(),
          },
        },
      );

      this.sessionManager.updateCookies(res.headers['set-cookie']);
    } catch (error) {
      this.logger.error('Error during login:', error);
      throw new InternalServerErrorException('Failed to login to Shift');
    }
  }

  private extractAuthenticityToken(data: string): string {
    const match = data.match(SHIFT_REGEX.AUTHENTICITY_TOKEN);
    if (!match || !match[1]) {
      throw new InternalServerErrorException(
        'Could not extract authenticity token',
      );
    }
    return match[1];
  }
}
