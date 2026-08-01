import { Module } from '@nestjs/common';
import { MemberActivityService } from './member-activity.service';

@Module({
  providers: [MemberActivityService],
  exports: [MemberActivityService],
})
export class MemberActivityModule {}
