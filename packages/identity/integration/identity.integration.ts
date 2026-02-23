//https://golevelup.github.io/nestjs/modules/rabbitmq.html
//https://tryrabbitmq.com/
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { EmailProducer } from './producers/email.producer';
import rabbitmqConfig, { RabbitMQConfig } from '@hub/shared-module/integrations/config/rabbitmq.config';
import { NotificationExchange, NotificationExchangeType, NotificationQueue } from '@hub/shared-module/integrations';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Global()
@Module({
  imports: [
    ConfigModule.forFeature(rabbitmqConfig),
    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { uri } = configService.get('rabbitmq') as RabbitMQConfig;

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
export class IdentityIntegrationModule { }
