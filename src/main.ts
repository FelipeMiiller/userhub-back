import { ValidationPipe } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AllExceptionsFilter } from './common/filters/exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerService } from './common/loggers/domain/logger.service';
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { LastActivityInterceptor } from './common/interceptors/last-activity.interceptor';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env: ConfigType<typeof appConfig> = app.get(ConfigService).get('app');
  const logger = await app.resolve(LoggerService);
  const cacheManager = await app.resolve(CacheModule);
  logger.contextName = bootstrap.name;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin === env.frontendUrl) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  const configSwagger = new DocumentBuilder()
    .setTitle('UserHub')
    .setDescription('API para gerenciamento de usuários')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
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
  // app.useGlobalInterceptors(
  //   new ClassSerializerInterceptor(app.get(Reflector)),
  //   new TransformInterceptor(),
  //   new LoggingInterceptor(logger),
  // );
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.enableShutdownHooks();

  await app.listen(env.port);
  logger.info(`Application is running on port ${env.port}`);
}
bootstrap();
