import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { NotificationService } from './notification.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedPost = jest.mocked(mockedAxios.post);

describe('NotificationService (axios webhook transport)', () => {
  let service: NotificationService;
  const WEBHOOK_URL = 'https://discord.com/api/webhooks/123/abc';
  let loggerErrorSpy: jest.SpyInstance;

  const buildModule = async (
    webhookConfigured: boolean,
  ): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key !== 'DISCORD_WEBHOOK_URL') return undefined;
              return webhookConfigured ? WEBHOOK_URL : undefined;
            }),
          },
        },
      ],
    }).compile();
  };

  const moduleWithUrl = () => buildModule(true);
  const moduleWithoutUrl = () => buildModule(false);

  beforeEach(() => {
    jest.resetAllMocks();
    mockedPost.mockResolvedValue({ status: 204, data: '' } as never);
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('should be defined when webhook URL is configured', async () => {
    const module = await moduleWithUrl();
    service = module.get<NotificationService>(NotificationService);
    expect(service).toBeDefined();
  });

  describe('notifyCodeRedeemed', () => {
    it('should POST a green embed with "Code redeemed: <code> on platform: <platform>"', async () => {
      const module = await moduleWithUrl();
      service = module.get<NotificationService>(NotificationService);

      await service.notifyCodeRedeemed('ABC123', 'steam');

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(mockedPost).toHaveBeenCalledWith(WEBHOOK_URL, {
        embeds: [
          {
            color: 0x57f287,
            description: 'Code redeemed: ABC123 on platform: steam',
          },
        ],
      });
    });

    it('should format descriptions for different codes and platforms', async () => {
      const module = await moduleWithUrl();
      service = module.get<NotificationService>(NotificationService);

      await service.notifyCodeRedeemed('XYZ9-ZXY9-XYZ9-ZXY9-ZYZ9', 'epic');

      expect(mockedPost).toHaveBeenCalledWith(WEBHOOK_URL, {
        embeds: [
          {
            color: 0x57f287,
            description:
              'Code redeemed: XYZ9-ZXY9-XYZ9-ZXY9-ZYZ9 on platform: epic',
          },
        ],
      });
    });
  });

  describe('notifyCodeFailed', () => {
    it('should POST an orange embed with "Code not redeemed: <code> on platform: <platform>"', async () => {
      const module = await moduleWithUrl();
      service = module.get<NotificationService>(NotificationService);

      await service.notifyCodeFailed('ABC123', 'steam');

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(mockedPost).toHaveBeenCalledWith(WEBHOOK_URL, {
        embeds: [
          {
            color: 0xe67e22,
            description: 'Code not redeemed: ABC123 on platform: steam',
          },
        ],
      });
    });
  });

  describe('notifyCodeExpired', () => {
    it('should POST a red embed with "Code expired: <code>" (no platform)', async () => {
      const module = await moduleWithUrl();
      service = module.get<NotificationService>(NotificationService);

      await service.notifyCodeExpired('ABC123');

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(mockedPost).toHaveBeenCalledWith(WEBHOOK_URL, {
        embeds: [
          {
            color: 0xed4245,
            description: 'Code expired: ABC123',
          },
        ],
      });
    });
  });

  describe('error handling', () => {
    it('should log and resolve without throwing when axios.post rejects', async () => {
      const module = await moduleWithUrl();
      service = module.get<NotificationService>(NotificationService);
      const error = new Error('Network down');
      mockedPost.mockRejectedValueOnce(error);

      await expect(
        service.notifyCodeRedeemed('CODE', 'xboxlive'),
      ).resolves.not.toThrow();
      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('missing webhook URL', () => {
    it('should log a diagnostic and skip the HTTP request when DISCORD_WEBHOOK_URL is undefined', async () => {
      const module = await moduleWithoutUrl();
      service = module.get<NotificationService>(NotificationService);

      await expect(
        service.notifyCodeRedeemed('CODE', 'steam'),
      ).resolves.not.toThrow();
      await expect(
        service.notifyCodeFailed('CODE', 'steam'),
      ).resolves.not.toThrow();
      await expect(service.notifyCodeExpired('CODE')).resolves.not.toThrow();

      expect(mockedPost).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('no discord.js usage', () => {
    it('should not import or reference discord.js in the notification service source', () => {
      const sourcePath = path.join(__dirname, 'notification.service.ts');
      const source = fs.readFileSync(sourcePath, 'utf-8');
      expect(source).not.toMatch(/discord\.js/);
      expect(source).not.toMatch(/WebhookClient|EmbedBuilder/);
    });
  });
});
