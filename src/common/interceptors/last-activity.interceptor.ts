import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
  } from '@nestjs/common';
  import { Cache } from 'cache-manager';
  import { Observable } from 'rxjs';
 
  
  @Injectable()
  export class LastActivityInterceptor implements NestInterceptor {
    constructor(
      @Inject('CACHE_MANAGER') private cacheManager: Cache,
    ) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const req = context.switchToHttp().getRequest();
      const user = req.user;
  
      if (user?.id) {
        const key = `user:lastLogin:${user.id}`;
        const now = new Date().toISOString();
  
        this.cacheManager.set(key, now,  60 * 60 * 24 ); 
      }
  
      return next.handle();
    }
  }
  