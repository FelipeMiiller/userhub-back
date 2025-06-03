import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Observable } from 'rxjs';

@Injectable()
export class LastActivityInterceptor implements NestInterceptor {
  constructor(@Inject('CACHE_MANAGER') private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
 
    const req = context.switchToHttp().getRequest();
    const user = req.user;


 
    if (user?.sub) {
      const key = `user:lastLogin:${user.sub}`;
      const now = new Date().toISOString();

      await this.cacheManager.set(key, now, 60 * 60 * 24);

      const existingIds = (await this.cacheManager.get<string[]>('user:loginQueue')) || [];
      if (!existingIds.includes(user.sub)) {
        existingIds.push(user.sub);
        await this.cacheManager.set('user:loginQueue', existingIds, 60 * 60 * 24);
      }
  
    } else {
  
    }

    return next.handle();
  }
}
