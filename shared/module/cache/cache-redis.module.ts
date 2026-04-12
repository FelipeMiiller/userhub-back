import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<CacheModuleOptions> => {
        if (process.env.NODE_ENV === 'test') {
          return {
            store: 'none',
            ttl: 0,
          } as CacheModuleOptions;
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
  ],
  providers: [],
  exports: [CacheModule],
})
export class SharedCacheRedisModule {}
