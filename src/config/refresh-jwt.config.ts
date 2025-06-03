import { registerAs } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt';
export default registerAs(
  'refresh-jwt',
  (): JwtModuleOptions => ({
    secret: process.env.REFRESH_JWT_SECRET || 'secret',
    signOptions: {
      expiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256',
    },
  }),
);
