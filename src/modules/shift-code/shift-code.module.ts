import { Module } from '@nestjs/common';
import { ShiftCodeService } from './shift-code.service';
import { MentalMarsAdapter } from './adapters/mental-mars.adapter';
import { SHIFT_CODE_ADAPTER } from './interfaces/shift-code-adapter.interface';

@Module({
  controllers: [],
  providers: [
    ShiftCodeService,
    {
      provide: SHIFT_CODE_ADAPTER,
      useClass: MentalMarsAdapter,
    },
  ],
  exports: [ShiftCodeService],
})
export class ShiftCodeModule {}
