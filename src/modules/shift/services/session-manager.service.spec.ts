import { Test, TestingModule } from '@nestjs/testing';
import { SessionManagerService } from './session-manager.service';
import { PlatformsEnum } from '../types/platforms.enum';

describe('SessionManagerService', () => {
  let service: SessionManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionManagerService],
    }).compile();

    service = module.get<SessionManagerService>(SessionManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialize', () => {
    it('should create empty session', () => {
      service.initialize();
      expect(service.getCookieJar()).toBe('');
      expect(service.getCsrfToken()).toBe('');
      expect(service.getValidatedCodes()).toEqual([]);
      expect(service.getPlatforms()).toEqual([]);
    });
  });

  describe('updateCookies', () => {
    it('should update cookies from set-cookie header', () => {
      service.initialize();
      const setCookieHeader = [
        'session_id=abc123; Path=/',
        'user_id=1; Path=/',
      ];

      service.updateCookies(setCookieHeader);

      expect(service.getCookieJar()).toContain('session_id=abc123');
      expect(service.getCookieJar()).toContain('user_id=1');
    });

    it('should handle undefined set-cookie header', () => {
      service.initialize();
      service.updateCookies(undefined);
      expect(service.getCookieJar()).toBe('');
    });
  });

  describe('setAuthenticityTokenHome', () => {
    it('should set authenticity token home', () => {
      service.initialize();
      service.setAuthenticityTokenHome('test_token');
      expect(service.getAuthenticityTokenHome()).toBe('test_token');
    });
  });

  describe('setCsrfToken', () => {
    it('should set CSRF token', () => {
      service.initialize();
      service.setCsrfToken('csrf_token');
      expect(service.getCsrfToken()).toBe('csrf_token');
    });
  });

  describe('addValidatedCode', () => {
    it('should add validated code', () => {
      service.initialize();
      service.addValidatedCode('ABC12-ABC12-ABC12-ABC12-ABC12', true);
      const codes = service.getValidatedCodes();
      expect(codes).toHaveLength(1);
      expect(codes[0].code).toBe('ABC12-ABC12-ABC12-ABC12-ABC12');
      expect(codes[0].isValid).toBe(true);
    });

    it('should not include invalid codes in getValidatedCodes', () => {
      service.initialize();
      service.addValidatedCode('CODE1', true);
      service.addValidatedCode('CODE2', false);
      const codes = service.getValidatedCodes();
      expect(codes).toHaveLength(1);
      expect(codes[0].code).toBe('CODE1');
    });
  });

  describe('setPlatforms', () => {
    it('should set platforms', () => {
      service.initialize();
      const platforms = [PlatformsEnum.XBOX, PlatformsEnum.STEAM];
      service.setPlatforms(platforms);
      expect(service.getPlatforms()).toEqual(platforms);
    });
  });

  describe('hasValidCodes', () => {
    it('should return true when there are valid codes', () => {
      service.initialize();
      service.addValidatedCode('CODE1', true);
      expect(service.hasValidCodes()).toBe(true);
    });

    it('should return false when there are no valid codes', () => {
      service.initialize();
      expect(service.hasValidCodes()).toBe(false);
    });
  });

  describe('resetValidatedCodes', () => {
    it('should reset validated codes and platforms', () => {
      service.initialize();
      service.addValidatedCode('CODE1', true);
      service.setPlatforms([PlatformsEnum.XBOX]);

      service.resetValidatedCodes();

      expect(service.getValidatedCodes()).toEqual([]);
      expect(service.getPlatforms()).toEqual([]);
    });
  });
});
