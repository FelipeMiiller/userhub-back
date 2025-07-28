import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { LoggerService } from 'shared/modules/loggers';
import { RabbitMQConfig } from 'shared/config/rabbitmq.config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);
  const rabbitmqConfig = configService.get<RabbitMQConfig>('rabbitmq');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqConfig.uri],
    },
  });
  const logger = await app.resolve(LoggerService);
  logger.contextName = bootstrap.name;
  logger.info(`Application is Module Notification running a Microservice not port configuration.`);

  await app.listen();
}
bootstrap();
