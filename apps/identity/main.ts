import { ConfigService, ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../identity/app.module';
import appConfig from '@hub/shared-lib/core/config/app.config';
import identityConfig from './config/identity.config';
import { LoggerService } from '@hub/shared-module/loggers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const IdentityConfig: ConfigType<typeof identityConfig> = configService.get('identity');
  const AppConfig: ConfigType<typeof appConfig> = configService.get('app');
  const logger = await app.resolve(LoggerService);
  logger.contextName = bootstrap.name;

  app.enableCors(AppConfig.corsConfig);

  const configSwagger = new DocumentBuilder()
    .setTitle('Identity-Module')
    .setDescription(
      'Identity-Module API para gerenciamento de usuários, autenticação e autorização',
    )
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
