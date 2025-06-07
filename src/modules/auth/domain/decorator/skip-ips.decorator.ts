import { SetMetadata } from '@nestjs/common';

export const ALLOWED_IPS_KEY = 'allowedIps';
/**
 * Decorator para definir IPs que são os únicos permitidos a acessar o endpoint
 */
export const AllowedIps = (ips: string[]) => SetMetadata(ALLOWED_IPS_KEY, ips);
