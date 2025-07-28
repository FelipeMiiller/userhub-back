import { ConfigService, ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import appConfig from 'shared/config/app.config';
import monolithConfig from './config/monolith.config';
import { LoggerService } from 'shared/modules/loggers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const MonolithConfig: ConfigType<typeof monolithConfig> = configService.get('monolith');
  const AppConfig: ConfigType<typeof appConfig> = configService.get('app');
  const logger = await app.resolve(LoggerService);
  logger.contextName = bootstrap.name;

  app.enableCors(AppConfig.corsConfig);

  const configSwagger = new DocumentBuilder()
    .setTitle('UserHub')
    .setDescription('API para gerenciamento de usuários')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  app.enableShutdownHooks();

  await app.listen(MonolithConfig.port);

  logger.info(
    `Application is running on port ${MonolithConfig.port}, environment: ${AppConfig.environment}`,
  );
}
bootstrap();
