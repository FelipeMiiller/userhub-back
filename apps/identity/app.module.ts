import { ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { LoggingInterceptor } from '@hub/shared-lib/core/interceptors/logging.interceptor';
import { TransformInterceptor } from '@hub/shared-lib/core/interceptors/transform.interceptor';
import { HealthController } from '@hub/shared-lib/core/health/http/health-check.controller';
import { ServerExceptionFilter } from '@hub/shared-lib/core/filters/service-exception.filter';
import { IdentityModule } from '@hub/identity/identity.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule, LoggerService } from '@hub/shared-module/loggers';
import { SharedCacheRedisModule } from '@hub/shared-module/cache';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SharedCacheRedisModule,
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
      useValue: 'Identity',
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
