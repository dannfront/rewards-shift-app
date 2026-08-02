import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShiftService } from './modules/shift/services/shift.service';
import { ShiftCodeService } from './modules/shift-code/shift-code.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockShiftService = {
      redeemAllCodes: jest.fn(),
    };

    const mockShiftCodeService = {
      fetchLatestCodes: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: ShiftService, useValue: mockShiftService },
        { provide: ShiftCodeService, useValue: mockShiftCodeService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
