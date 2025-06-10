import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheThrottlerStorage } from './domain/cache-throttler-storage';
import { UnifiedThrottlerGuard } from './domain/guards/unified-throttler.guard';

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
            ttl: 60000, // 1 minute
            limit: 20, // 20 requests per minute
            blockDuration: 60000, // 1 minute block
          },
          {
            name: 'medium',
            ttl: 600000, // 10 minutes
            limit: 100, // 100 requests per 10 minutes
            blockDuration: 60000, // 1 minute block
          },
        ],
        getTracker: (req) => req.ip,
      }),
      inject: [CacheThrottlerStorage],
    }),
  ],
  providers: [
    CacheThrottlerStorage,
    {
      provide: APP_GUARD,
      useClass: UnifiedThrottlerGuard,
    },
  ],
  exports: [CacheThrottlerStorage, CacheModule, ThrottlerModule],
})
export class ThrottlerConfigModule {}
