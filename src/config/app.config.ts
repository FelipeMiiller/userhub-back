import { registerAs } from '@nestjs/config';
//import { pathEnv } from './pathEnv';
//import { config as dotenvConfig } from 'dotenv';

//dotenvConfig({ path: pathEnv });
export default registerAs('app', () => ({
  port: process.env.PORT || '3000',
  origin: process.env.ORIGIN || 'http://localhost:3000',
}));
