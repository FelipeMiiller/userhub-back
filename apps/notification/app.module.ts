import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { pathEnv } from 'shared/lib/utils/pathEnv';
import { NotificationModule } from 'packages/notification/notification.module';
import rabbitmqConfig from 'shared/config/rabbitmq.config';
import { MicroserviceExceptionFilter } from 'shared/core/filters/microservice-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { LoggerService } from 'shared/modules/loggers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rabbitmqConfig],
      envFilePath: pathEnv,
    }),
    NotificationModule,
  ],
  providers: [
    {
      provide: 'MODULE_NAME',
      useValue: 'Notification',
    },
    {
      provide: APP_FILTER,
      useFactory: (loggerService: LoggerService, moduleName: string) =>
        new MicroserviceExceptionFilter(moduleName, loggerService),
      inject: [LoggerService, 'MODULE_NAME'],
    },
  ],
})
export class AppModule {}
