import { Global, Module } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EmailProducer } from './producers/email.producer';

/**
 * Módulo de integração mock para ambiente de teste.
 * Provê EmailProducer com AmqpConnection simulado (sem RabbitMQ real).
 */
@Global()
@Module({
  providers: [
    {
      provide: AmqpConnection,
      useValue: {
        publish: () => Promise.resolve(undefined),
      },
    },
    EmailProducer,
  ],
  exports: [EmailProducer],
})
export class IdentityTestIntegrationModule {}
