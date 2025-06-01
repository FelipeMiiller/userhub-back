import { Module } from '@nestjs/common';

import { LoggerService } from './domain/logger.service';
import { LoggersRepository } from './domain/repositories/logger.repository';
import { LoggersController } from './http/loggers.controler';
import mongoConfig from 'src/config/mongo.config';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Logger, LoggerSchema } from './domain/logger.schema';
import slackConfig from 'src/config/slack.config';
import { SlackLoggerService } from './domain/slack-logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Logger.name, schema: LoggerSchema }]),
    ConfigModule.forFeature(slackConfig),
  ],
  providers: [LoggerService, LoggersRepository, SlackLoggerService],
  exports: [LoggerService],
  controllers: [LoggersController],
})
export class LoggerModule {}
