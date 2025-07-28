import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { LoggerService } from 'shared/modules/loggers';
import { UsersService } from '../account/core/services/users.service';

@Injectable()
export class LastActivityService {
  constructor(
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
    private usersService: UsersService,
    private loggerService: LoggerService,
  ) {}

  @Cron('*/10 * * * *')
  async syncLastLoginTimestamps() {
    this.loggerService.debug('🔄 Sincronizando dados de lastLoginAt do Redis para o banco...');
    const userIds = await this.cacheManager.get<string[]>('user:loginQueue');
    if (!userIds || !Array.isArray(userIds)) return;

    for (const userId of userIds) {
      const key = `user:lastLogin:${userId}`;
      const lastLogin = await this.cacheManager.get<string>(key);

      if (lastLogin) {
        await this.usersService.update(userId, {
          LastLoginAt: new Date(lastLogin),
        });
        await this.cacheManager.del(key);
      }
    }

    await this.cacheManager.del('user:loginQueue');
  }
}
