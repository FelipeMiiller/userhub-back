//https://golevelup.github.io/nestjs/modules/rabbitmq.html
//https://tryrabbitmq.com/
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import rabbitmqConfig from 'shared/config/rabbitmq.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProducer } from './producers/email.producer';
import {
  NotificationExchange,
  NotificationExchangeType,
  NotificationQueue,
} from 'shared/modules/integration/notifications/notification.types';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(rabbitmqConfig),
    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('rabbitmq.uri');
        return {
          uri,
          connectionInitOptions: { wait: false }, // Wait for the connection to be establishe
          queues: [
            {
              name: NotificationQueue.NOTIFICATIONS_EMAIL_QUEUE,
              exchange: NotificationExchange.DIRECT_EXCHANGE,
              routingKey: NotificationQueue.NOTIFICATIONS_EMAIL_QUEUE,
            },
          ],
          exchanges: [
            {
              name: NotificationExchange.DIRECT_EXCHANGE,
              type: NotificationExchangeType.DIRECT,
            },
          ],
        };
      },
    }),
  ],
  providers: [EmailProducer],
  exports: [EmailProducer],
})
export class IdentityIntegrationModule {}
