import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { pathEnv } from '@hub/shared-module/config';
import { NotificationModule } from '@packages/notification/notification.module';
import rabbitmqConfig from '@hub/shared-module/integrations/config/rabbitmq.config';
import { MicroserviceExceptionFilter } from '@hub/shared-lib/core/filters/microservice-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { LoggerService } from '@hub/shared-module/loggers';

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
