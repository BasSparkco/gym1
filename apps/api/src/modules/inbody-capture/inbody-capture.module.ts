import { Module } from '@nestjs/common';
import { InbodyCaptureController } from './inbody-capture.controller';
import { InbodyCaptureCleanupService } from './inbody-capture-cleanup.service';

@Module({
  controllers: [InbodyCaptureController],
  providers: [InbodyCaptureCleanupService],
})
export class InbodyCaptureModule {}
