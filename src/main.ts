import { ValidationPipe } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from './common/loggers/domain/logger.service';
import { AppModule } from './app.module';
import appConfig from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env: ConfigType<typeof appConfig> = app.get(ConfigService).get('app');
  const logger = await app.resolve(LoggerService);

  logger.contextName = bootstrap.name;

  app.enableCors({
    origin: [env.origin, ...env.accessibleIps],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  app.enableShutdownHooks();

  await app.listen(env.port);
  logger.info(`Application is running on port ${env.port}`);
}
bootstrap();
