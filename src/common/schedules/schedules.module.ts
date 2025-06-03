import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/common/loggers/logger.module';

import { ScheduleModule } from '@nestjs/schedule';
import { LastActivityService } from './last-activity.schedule';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [ScheduleModule.forRoot(), LoggerModule, UsersModule],
  providers: [LastActivityService],
  exports: [],
})
export class SchedulesModule {}
