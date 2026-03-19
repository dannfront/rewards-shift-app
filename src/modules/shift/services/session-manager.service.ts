import { Injectable, Logger } from '@nestjs/common';
import { parseCookies } from '../../shared/utils/parseCookies.util';
import {
  ShiftSession,
  ValidatedCode,
} from '../interfaces/shift-session.interface';
import { PlatformsEnum } from '../types/platforms.enum';

@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private session: ShiftSession;

  constructor() {
    this.session = this.createEmptySession();
  }

  private createEmptySession(): ShiftSession {
    return {
      cookieJar: '',
      csrfToken: '',
      authenticityTokenHome: undefined,
      authenticityTokenModal: undefined,
      archwayCodeRedemption: undefined,
      archwayCodeRedemptionTitle: undefined,
      validatedCodes: [],
      platforms: [],
    };
  }

  initialize(): void {
    this.session = this.createEmptySession();
  }

  updateCookies(setCookieHeader: string[] | undefined): void {
    const newCookies = parseCookies(setCookieHeader);
    if (!newCookies) return;

    if (!this.session.cookieJar) {
      this.session.cookieJar = newCookies;
      return;
    }

    // Parsear cookies actuales en un Map
    const cookieMap = new Map<string, string>();
    for (const cookie of this.session.cookieJar.split('; ')) {
      const [name, ...rest] = cookie.split('=');
      cookieMap.set(name.trim(), rest.join('='));
    }

    // Sobreescribir con las nuevas (reemplaza _session_id en vez de duplicar)
    for (const cookie of newCookies.split('; ')) {
      const [name, ...rest] = cookie.split('=');
      cookieMap.set(name.trim(), rest.join('='));
    }

    this.session.cookieJar = Array.from(cookieMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  setAuthenticityTokenHome(token: string): void {
    this.session.authenticityTokenHome = token;
  }

  setCsrfToken(token: string): void {
    this.session.csrfToken = token;
  }

  setAuthenticityTokenModal(token: string): void {
    this.session.authenticityTokenModal = token;
  }

  setArchwayCodeRedemption(check: string, title: string): void {
    this.session.archwayCodeRedemption = check;
    this.session.archwayCodeRedemptionTitle = title;
  }

  addValidatedCode(code: string, isValid: boolean): void {
    this.session.validatedCodes.push({ code, isValid });
  }

  setPlatforms(platforms: PlatformsEnum[]): void {
    this.session.platforms = platforms;
  }

  getAuthenticityTokenHome(): string | undefined {
    return this.session.authenticityTokenHome;
  }

  getCsrfToken(): string {
    return this.session.csrfToken;
  }

  getAuthenticityTokenModal(): string | undefined {
    return this.session.authenticityTokenModal;
  }

  getArchwayCodeRedemption(): string | undefined {
    return this.session.archwayCodeRedemption;
  }

  getArchwayCodeRedemptionTitle(): string | undefined {
    return this.session.archwayCodeRedemptionTitle;
  }

  getCookieJar(): string {
    return this.session.cookieJar;
  }

  getValidatedCodes(): ValidatedCode[] {
    return this.session.validatedCodes.filter((c) => c.isValid);
  }

  getPlatforms(): PlatformsEnum[] {
    return this.session.platforms;
  }

  getSession(): ShiftSession {
    return this.session;
  }

  hasValidCodes(): boolean {
    return this.session.validatedCodes.some((c) => c.isValid);
  }

  resetValidatedCodes(): void {
    this.session.validatedCodes = [];
    this.session.platforms = [];
  }
}
