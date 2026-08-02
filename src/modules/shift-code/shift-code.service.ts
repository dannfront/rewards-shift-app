import { Inject, Injectable } from '@nestjs/common';
import { SHIFT_CODE_ADAPTER } from './interfaces/shift-code-adapter.interface';
import type { IShiftCodeAdapter } from './interfaces/shift-code-adapter.interface';
import type { ShiftCode } from './interfaces/shift-code.interface';

@Injectable()
export class ShiftCodeService {
  constructor(
    @Inject(SHIFT_CODE_ADAPTER) private readonly adapter: IShiftCodeAdapter,
  ) {}

  async fetchLatestCodes(): Promise<ShiftCode[]> {
    const codes = await this.adapter.fetchCodes();
    return codes.slice(0, 5);
  }
}
