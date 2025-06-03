import { registerAs } from '@nestjs/config';
//import { pathEnv } from './pathEnv';
//import { config as dotenvConfig } from 'dotenv';

//dotenvConfig({ path: pathEnv });

interface AppConfig {
  port: string;
  origin: string;
  frontendUrl: string;
  environment: string;
}
export default registerAs(
  'app',
  (): AppConfig => ({
    port: process.env.PORT || '3005',
    origin: process.env.ORIGIN || 'http://localhost:3005',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
  }),
);
