import { ScheduleModule } from '@nestjs/schedule';
import { LastActivityService } from './last-activity.schedule';
import { Module } from '@nestjs/common';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [],
  providers: [LastActivityService],
})
export class IdentityScheduleModule {}
