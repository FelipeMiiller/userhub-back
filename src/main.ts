import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AllExceptionsFilter } from './common/filters/exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerService } from './common/loggers/domain/logger.service';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(ConfigService).get('app');
  const logger = await app.resolve(LoggerService);
  logger.contextName = bootstrap.name;

  app.enableCors({ origin: env.origin });

  const configSwagger = new DocumentBuilder()
    .setTitle('Template-Nest')
    .setDescription('Template-Nest')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor(logger));
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.enableShutdownHooks();

  await app.listen(env.port);
  logger.info(`Application is running on port ${env.port}`);
}
bootstrap();
