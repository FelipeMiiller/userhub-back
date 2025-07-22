import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { LoggerService } from 'shared/modules/loggers/domain/logger.service';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
    },
  });
  const logger = await app.resolve(LoggerService);
  logger.contextName = bootstrap.name;
  logger.info(`Application is Module Notification running a Microservice not port configuration.`);

  await app.listen();
}
bootstrap();
