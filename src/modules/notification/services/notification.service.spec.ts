import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { DiscordService } from '../../discord/discord.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let discordService: DiscordService;

  beforeEach(async () => {
    const mockDiscordService = {
      sendCodeRedeemed: jest.fn(),
      sendCodeNotRedeemed: jest.fn(),
      sendCodeExpired: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: DiscordService,
          useValue: mockDiscordService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    discordService = module.get(DiscordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('notifyCodeRedeemed', () => {
    it('should call discord service to send code redeemed notification', async () => {
      const code = 'ABC12-ABC12-ABC12-ABC12-ABC12';
      const platform = 'xboxlive';
      const spy = jest.spyOn(discordService, 'sendCodeRedeemed');

      await service.notifyCodeRedeemed(code, platform);

      expect(spy).toHaveBeenCalledWith(code, platform);
      spy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      jest
        .spyOn(discordService, 'sendCodeRedeemed')
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.notifyCodeRedeemed('CODE', 'xboxlive'),
      ).resolves.not.toThrow();
    });
  });

  describe('notifyCodeFailed', () => {
    it('should call discord service to send code failed notification', async () => {
      const code = 'ABC12-ABC12-ABC12-ABC12-ABC12';
      const platform = 'steam';
      const spy = jest.spyOn(discordService, 'sendCodeNotRedeemed');

      await service.notifyCodeFailed(code, platform);

      expect(spy).toHaveBeenCalledWith(code, platform);
      spy.mockRestore();
    });
  });

  describe('notifyCodeExpired', () => {
    it('should call discord service to send code expired notification', async () => {
      const code = 'ABC12-ABC12-ABC12-ABC12-ABC12';
      const spy = jest.spyOn(discordService, 'sendCodeExpired');

      await service.notifyCodeExpired(code);

      expect(spy).toHaveBeenCalledWith(code);
      spy.mockRestore();
    });
  });
});
