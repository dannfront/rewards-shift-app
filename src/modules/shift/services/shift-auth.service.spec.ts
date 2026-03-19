import { Test, TestingModule } from '@nestjs/testing';
import { ShiftAuthService } from './shift-auth.service';
import { SessionManagerService } from './session-manager.service';
import { ShiftAxiosClient } from '../../shared/http/axios-client.factory';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';

describe('ShiftAuthService', () => {
  let service: ShiftAuthService;
  let shiftAxiosClient: jest.Mocked<ShiftAxiosClient>;
  let sessionManager: jest.Mocked<SessionManagerService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockShiftAxiosClient = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockSessionManager = {
      setAuthenticityTokenHome: jest.fn(),
      updateCookies: jest.fn(),
      setAuthenticityTokenModal: jest.fn(),
      getCookieJar: jest.fn().mockReturnValue('cookie_jar'),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftAuthService,
        { provide: ShiftAxiosClient, useValue: mockShiftAxiosClient },
        { provide: SessionManagerService, useValue: mockSessionManager },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ShiftAuthService>(ShiftAuthService);
    shiftAxiosClient = module.get(ShiftAxiosClient);
    sessionManager = module.get(SessionManagerService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchHomePage', () => {
    it('should fetch home page and extract authenticity token', async () => {
      const mockResponse = {
        data: 'some html with name="authenticity_token" value="test_token"',
        headers: { 'set-cookie': ['session=abc'] },
      };
      shiftAxiosClient.get.mockResolvedValue(mockResponse as any);

      const result = await service.fetchHomePage();

      expect(result).toBe('test_token');
      expect(sessionManager.setAuthenticityTokenHome).toHaveBeenCalledWith(
        'test_token',
      );
      expect(sessionManager.updateCookies).toHaveBeenCalledWith([
        'session=abc',
      ]);
    });

    it('should throw InternalServerErrorException on network error', async () => {
      shiftAxiosClient.get.mockRejectedValue(new Error('Network error'));

      await expect(service.fetchHomePage()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
