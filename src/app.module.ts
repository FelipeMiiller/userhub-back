import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './common/loggers/logger.module';
import { UsersModule } from './modules/users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import mongoConfig from './config/mongo.config';
import slackConfig from './config/slack.config';
import { pathEnv } from './config/pathEnv';
import appConfig from './config/app.config';
import redisConfig from './config/redis.config';
import typeormConfig from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ScheduleModule } from '@nestjs/schedule';
import { LastActivityInterceptor } from './common/interceptors/last-activity.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { User } from './modules/users/domain/models/users.models';
import { SchedulesModule } from './common/schedules/schedules.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ...(process.env.NODE_ENV !== 'test' ? [SchedulesModule] : []),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 10,
      },

      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (process.env.NODE_ENV === 'test') {
          return {
            store: 'none' as any, // Use 'none' for test environment
            ttl: 0, // Provide a default ttl for 'none' store to satisfy types
          };
        }
        const store = await redisStore({
          socket: {
            host: configService.get('redis.host'),
            port: Number(configService.get('redis.port')),
          },
        });
        return {
          store,
          ttl: Number(configService.get('redis.ttl')),
        };
      },
    }),
    ConfigModule.forRoot({
      envFilePath: [pathEnv],
      isGlobal: true,
      load: [appConfig, typeormConfig, mongoConfig, slackConfig, redisConfig],
    }),
    TypeOrmModule.forFeature([User]),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => configService.get('typeorm'),
    }),
    LoggerModule,
    UsersModule,
    AuthModule,
  ],

  controllers: [AppController],
  providers: [
    ...(process.env.NODE_ENV !== 'test' ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }] : []),
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
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LastActivityInterceptor,
    },
  ],
  exports: [ConfigModule],
})
export class AppModule {}
