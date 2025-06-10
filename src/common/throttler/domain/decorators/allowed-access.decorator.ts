import { SetMetadata } from '@nestjs/common';

export const ALLOWED_ACCESS_KEY = 'allowedAccess';
/**
 * Decorator para definir IPs que são os únicos permitidos a acessar o endpoint
 */
export const AllowedAccess = (ips: string[]) => SetMetadata(ALLOWED_ACCESS_KEY, ips);
