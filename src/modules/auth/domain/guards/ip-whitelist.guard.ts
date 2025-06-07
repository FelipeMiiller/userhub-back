import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOWED_IPS_KEY } from '../decorator/skip-ips.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}
  s;
  canActivate(context: ExecutionContext): boolean {
    const allowedIps = this.reflector.getAllAndOverride<string[]>(ALLOWED_IPS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    allowedIps.push(...this.configService.get<string[]>('app.accessibleIps'));

    const request = context.switchToHttp().getRequest();
    const clientIp = this.getClientIP(request);

    if (!allowedIps.includes(clientIp)) {
      throw new ForbiddenException(
        `Access denied for IP: ${clientIp}. This endpoint is restricted to specific IPs only.`,
      );
      return false;
    }

    return true;
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
