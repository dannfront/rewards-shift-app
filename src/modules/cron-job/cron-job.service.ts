import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShiftService } from '../shift/services/shift.service';
import { ShiftCodeService } from '../shift-code/shift-code.service';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftCodeService: ShiftCodeService,
  ) {}

  //todo activar el cron
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Iniciando el trabajo por lotes');
    const codes = await this.shiftCodeService.fetchLatestCodes();
    await this.shiftService.redeemAllCodes(codes);
    this.logger.log('Trabajo por lotes finalizado');
  }
}
