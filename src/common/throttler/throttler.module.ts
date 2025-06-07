import { Global, Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheThrottlerStorage } from './domain/cache-throttler-storage';
import { HealthController } from './http/health-check.controller';
import { CustomThrottlerGuard } from './domain/guards/custom-rate-limiter.guard';
import { ThrottlerModule } from '@nestjs/throttler';

@Global()
@Module({
  imports: [
    TypeOrmModule,
    CacheModule.register({
      ttl: 60,
      max: 1000,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ThrottlerConfigModule],
      useFactory: (cacheStorage: CacheThrottlerStorage) => ({
        storage: cacheStorage,
        throttlers: [
          {
            name: 'short',
            ttl: 60000,
            limit: 20,
            blockDuration: 60000,
          },
          {
            name: 'medium',
            ttl: 600000,
            limit: 100,
            blockDuration: 60000,
          },
        ],

        getTracker: (req) => req.ip,
      }),
      inject: [CacheThrottlerStorage],
    }),
  ],
  controllers: [HealthController],
  providers: [
    CacheThrottlerStorage,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    Reflector,
  ],
  exports: [CacheThrottlerStorage, CacheModule],
})
export class ThrottlerConfigModule {}
