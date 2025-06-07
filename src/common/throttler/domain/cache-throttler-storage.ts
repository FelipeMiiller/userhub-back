import { Cache } from 'cache-manager';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { Inject } from '@nestjs/common';

export class CacheThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject('CACHE_MANAGER') private cacheManager: Cache) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): Promise<ThrottlerStorageRecord> {
    try {
      const current = await this.cacheManager.get<number>(key);
      const newCount = current ? current + 1 : 1;
      await this.cacheManager.set(key, newCount, ttl);

      const timeToExpire = ttl;
      const isBlocked = newCount > limit;
      const timeToBlockExpire = isBlocked ? blockDuration : 0;

      return {
        totalHits: newCount,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      };
    } catch (error) {
      console.error('Cache increment error:', error);
      throw error;
    }
  }

  async isRateLimited(key: string, limit: number): Promise<boolean> {
    try {
      const current = await this.cacheManager.get<number>(key);
      return current ? current > limit : false;
    } catch (error) {
      console.error('Cache rate limit check error:', error);
      return false;
    }
  }
}
