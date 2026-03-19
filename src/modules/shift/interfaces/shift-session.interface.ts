import { PlatformsEnum } from '../types/platforms.enum';

export interface ShiftSession {
  cookieJar: string;
  csrfToken: string;
  authenticityTokenHome?: string;
  authenticityTokenModal?: string;
  archwayCodeRedemption?: string;
  archwayCodeRedemptionTitle?: string;
  validatedCodes: ValidatedCode[];
  platforms: PlatformsEnum[];
}

export interface ValidatedCode {
  code: string;
  isValid: boolean;
}

export interface RedemptionResult {
  url: string;
  text: string;
}
