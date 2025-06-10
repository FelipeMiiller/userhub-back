import { ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './common/loggers/logger.module';
import { UsersModule } from './modules/users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import slackConfig from './config/slack.config';
import { pathEnv } from './config/pathEnv';
import appConfig from './config/app.config';
import redisConfig from './config/redis.config';
import typeormConfig from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { redisStore } from 'cache-manager-redis-yet';
import { LastActivityInterceptor } from './common/interceptors/last-activity.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SchedulesModule } from './common/schedules/schedules.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/loggers/domain/logger.service';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerConfigModule } from './common/throttler/throttler.module';
import { HealthController } from './common/health/http/health-check.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [pathEnv],
      isGlobal: true,
      load: [appConfig, typeormConfig, slackConfig, redisConfig],
    }),
    EventEmitterModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (process.env.NODE_ENV === 'test') {
          return {
            store: 'none' as any,
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
    ThrottlerConfigModule,

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => configService.get('typeorm'),
    }),
    ...(process.env.NODE_ENV !== 'test' ? [SchedulesModule] : []),
    LoggerModule,
    UsersModule,
    AuthModule,
  ],

  providers: [
    ...(process.env.NODE_ENV !== 'test'
      ? [
          {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
          },
          {
            provide: APP_INTERCEPTOR,
            useClass: LastActivityInterceptor,
          },
        ]
      : []),
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
          whitelist: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
          forbidNonWhitelisted: true,
        }),
    },
    {
      provide: APP_FILTER,
      useFactory: (loggerService: LoggerService) => new AllExceptionsFilter(loggerService),
      inject: [LoggerService],
    },
  ],
  controllers: [HealthController],
})
export class AppModule {}
