import { ShiftCode } from './shift-code.interface';

export interface IShiftCodeAdapter {
  fetchCodes(): Promise<ShiftCode[]>;
}

export const SHIFT_CODE_ADAPTER = 'SHIFT_CODE_ADAPTER';
