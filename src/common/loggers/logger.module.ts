import { Global, Module } from '@nestjs/common';

import { LoggerService } from './domain/logger.service';

import { SlackLoggerService } from './domain/slack-logger.service';
@Global()
@Module({
  imports: [],
  providers: [LoggerService, SlackLoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
