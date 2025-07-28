import { Global, Module } from '@nestjs/common';
import { LoggerService } from './core/logger.service';
import { SlackLoggerService } from './core/slack-logger.service';
import { ConfigModule } from '@nestjs/config';
import loggerConfig from './config';
@Global()
@Module({
  imports: [ConfigModule.forFeature(loggerConfig)],
  providers: [LoggerService, SlackLoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
