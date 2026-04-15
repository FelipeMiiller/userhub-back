import { ConfigService, ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../identity/app.module';
import identityConfig from './config/identity.config';
import { LoggerService } from '@hub/shared-module/loggers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const IdentityConfig: ConfigType<typeof identityConfig> = configService.getOrThrow('identity');
  const logger = await app.resolve(LoggerService);
  logger.contextName = bootstrap.name;

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

  await app.listen(IdentityConfig.port);

  logger.info(
    `Application is running on port ${IdentityConfig.port}, environment: ${process.env.NODE_ENV ?? 'development'}`,
  );
}
bootstrap();
