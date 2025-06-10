import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { CacheThrottlerStorage } from '../cache-throttler-storage';
import { ALLOWED_ACCESS_KEY, SKIP_THROTTLE_FOR_IP_KEY, SKIP_THROTTLE_KEY } from '../decorators';

@Injectable()
export class UnifiedThrottlerGuard extends ThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(UnifiedThrottlerGuard.name);

  constructor(
    options: any,
    storageService: CacheThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  private normalizeIp(ip: string): string {
    if (!ip) return '';
    // Remove protocol and port if present
    const cleanIp = ip.replace(/(https?:\/\/|\/|:\d+$)/g, '');
    // Convert IPv4-mapped IPv6 to regular IPv4
    return cleanIp.startsWith('::ffff:') ? cleanIp.substring(7) : cleanIp;
  }

  private isIpAllowed(clientIp: string, allowedIps: string[]): boolean {
    if (!clientIp) return false;

    const normalizedClientIp = this.normalizeIp(clientIp);
    if (!normalizedClientIp) return false;

    return allowedIps.some((allowedIp) => {
      const normalizedAllowedIp = this.normalizeIp(allowedIp);
      // Support for wildcard subnets like '192.168.*'
      if (normalizedAllowedIp.includes('*')) {
        const regex = new RegExp(
          `^${normalizedAllowedIp.replace(/\./g, '\\.').replace(/\*/g, '\\d+')}$`,
        );
        return regex.test(normalizedClientIp);
      }
      return normalizedClientIp === normalizedAllowedIp;
    });
  }

  private getClientIP(request: any): string[] {
    // Get all possible IP sources
    const possibleIps = [
      // Standard headers (most reliable first)
      ...(request.headers['x-forwarded-for']?.split(',').map((ip: string) => ip.trim()) || []),
      request.headers['x-real-ip'],
      request.headers['x-client-ip'],

      // Direct connection info
      request.connection?.remoteAddress,
      request.socket?.remoteAddress,
      request.connection?.socket?.remoteAddress,
      request.ip,

      // Fallback to host header (least reliable)
      request.get('x-forwarded-for'),
      request.get('x-real-ip'),
      request.get('x-client-ip'),
      request.get('host'),
    ]
      // Remove empty values and normalize
      .filter(Boolean)
      .map((ip: string) => this.normalizeIp(ip));

    // Remove duplicates while preserving order
    return [...new Set(possibleIps)];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if throttling is disabled via decorator
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(SKIP_THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipThrottle) {
      this.logger.debug('Skipping throttling (skipThrottle decorator)');
      return true;
    }

    // Check IP whitelist first
    const allowedIps = [
      ...(this.reflector.getAllAndOverride<string[]>(ALLOWED_ACCESS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || []),
      ...(this.configService.get<string[]>('app.accessibleIps') || []),
      ...(this.reflector.getAllAndOverride<string[]>(SKIP_THROTTLE_FOR_IP_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || []),
    ];

    const clientIps = this.getClientIP(context.switchToHttp().getRequest());
    const canSkipThrottle = clientIps.some((ip) => this.isIpAllowed(ip, allowedIps));

    this.logger.debug('Throttle check', {
      clientIps,
      allowedIps,
      canSkipThrottle,
    });

    if (canSkipThrottle) {
      this.logger.debug(`Skipping throttling for IPs: ${clientIps.join(', ')}`);
      return true;
    }

    // Apply rate limiting for non-whitelisted IPs
    try {
      return await super.canActivate(context);
    } catch (error) {
      this.logger.warn('Throttler error', { error: error.message });
      throw error;
    }
  }
}
