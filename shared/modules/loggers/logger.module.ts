import { Global, Module } from '@nestjs/common';
import { LoggerService } from './domain/logger.service';
import { SlackLoggerService } from './domain/slack-logger.service';
import { ConfigModule } from '@nestjs/config';
import loggerConfig from './config';
@Global()
@Module({
  imports: [ConfigModule.forFeature(loggerConfig)],
  providers: [LoggerService, SlackLoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
