//https://golevelup.github.io/nestjs/modules/rabbitmq.html
//https://tryrabbitmq.com/
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailConsumer } from './consumer/email.consumer';
import {
  NotificationExchange,
  NotificationExchangeType,
  NotificationQueue,
} from 'shared/modules/integration/notifications/notification.types';
import rabbitmqConfig from 'shared/config/rabbitmq.config';
import { MailModule } from '../mail/mail.module';
import { PushNotificationModule } from '../push-notification/push-notification.module';

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
    MailModule,
    PushNotificationModule,
  ],
  providers: [EmailConsumer],
  exports: [EmailConsumer],
})
export class NotificationIntegrationModule {}
