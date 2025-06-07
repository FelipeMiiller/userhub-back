import { registerAs } from '@nestjs/config';
//import { pathEnv } from './pathEnv';
//import { config as dotenvConfig } from 'dotenv';

//dotenvConfig({ path: pathEnv });

interface AppConfig {
  port: string;
  origin: string;
  frontendUrl: string;
  environment: string;
  maxRequestDurationMs: string;
  accessibleIps: string[];
}
export default registerAs(
  'app',
  (): AppConfig => ({
    port: process.env.PORT || '3005',

    origin: process.env.ORIGIN || 'http://localhost:3005',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    maxRequestDurationMs: process.env.MAX_REQUEST_DURATION_MS || '300',
    accessibleIps: [
      ...(process.env.ACESSIBLE_IPS?.split(',')?.map((ip) => ip.trim()) || []),
      '127.0.0.1',
      '::1',
    ],
  }),
);
