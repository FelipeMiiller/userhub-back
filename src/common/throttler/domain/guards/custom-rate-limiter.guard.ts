import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SKIP_THROTTLE_FOR_IP_KEY, SKIP_THROTTLE_KEY } from '../decorators/skip-throttle.decorator';
import { CacheThrottlerStorage } from '../cache-throttler-storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: CacheThrottlerStorage,
    reflector: Reflector,
    private configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();

    // Verifica se deve pular o throttling
    const methodMetadata = this.reflector.get<boolean>(SKIP_THROTTLE_KEY, handler);

    if (methodMetadata) {
      return true;
    }

    // Verifica IPs permitidos
    const skipThrottles = this.reflector.get<string[]>(SKIP_THROTTLE_FOR_IP_KEY, handler);

    skipThrottles.push(...this.configService.get<string[]>('app.accessibleIps'));

    if (skipThrottles.length !== 0) {
      const request = context.switchToHttp().getRequest();
      const clientIp = this.getClientIP(request);

      return skipThrottles.includes(clientIp);
    }

    return super.canActivate(context);
  }

  private getClientIP(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.headers['x-client-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      '127.0.0.1'
    );
  }
}
