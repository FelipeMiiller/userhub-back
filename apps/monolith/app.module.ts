import { ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { LoggingInterceptor } from 'shared/core/interceptors/logging.interceptor';
import { LastActivityInterceptor } from 'shared/core/interceptors/last-activity.interceptor';
import { TransformInterceptor } from 'shared/core/interceptors/transform.interceptor';
import { pathEnv } from 'shared/lib/utils/pathEnv';
import { MailModule } from 'packages/notification/mail/mail.module';
import { IdentityModule } from 'packages/identity/identity.module';
import { LoggerService } from 'shared/modules/loggers';
import { HealthController } from 'shared/core/health/http/health-check.controller';
import { LoggerModule } from 'shared/modules/loggers/logger.module';
import appConfig from 'shared/config/app.config';
import monolithConfig from './config/monolith.config';
import redisConfig from './config/redis.config';
import { ServerExceptionFilter } from 'shared/core/filters/service-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, monolithConfig, redisConfig],
      envFilePath: pathEnv,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<CacheModuleOptions> => {
        if (process.env.NODE_ENV === 'test') {
          return {
            store: 'none',
            ttl: 0,
          };
        }
        const store = await redisStore({
          socket: {
            host: configService.get('redis.host'),
            port: Number(configService.get('redis.port')),
          },
          password: configService.get('redis.password'),
        });
        return {
          store,
          ttl: Number(configService.get('redis.ttl')),
        };
      },
    }),
    MailModule,
    LoggerModule,
    IdentityModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LastActivityInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector, {
          strategy: 'exposeAll',
          excludeExtraneousValues: false,
        }),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true, // Remove properties not defined in the dto
          transform: true, // Transform values to the type defined in the dto
          transformOptions: { enableImplicitConversion: true }, // Enable implicit conversion of values to the type defined in the dto
          forbidNonWhitelisted: true, // Forbid properties not defined in the dto
        }),
    },
    {
      provide: 'MODULE_NAME',
      useValue: 'Monolith',
    },
    {
      provide: APP_FILTER,
      useFactory: (loggerService: LoggerService, moduleName: string) =>
        new ServerExceptionFilter(moduleName, loggerService),
      inject: [LoggerService, 'MODULE_NAME'],
    },
  ],
  controllers: [HealthController],
})
export class AppModule {}
