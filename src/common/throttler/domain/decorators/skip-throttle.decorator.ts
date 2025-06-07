// skip-throttle.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'skipThrottle';
/**
 * Decorator para pular o rate limiting
 */

export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);

export const SKIP_THROTTLE_FOR_IP_KEY = 'skipThrottleForIp';
/**
 * Decorator para pular o rate limiting para IPs específicos
 * @param ips - Array de IPs ou um único IP para pular
 */
export const SkipThrottleForIp = (ips: string[]) => SetMetadata(SKIP_THROTTLE_FOR_IP_KEY, ips);
