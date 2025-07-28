import { registerAs } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { IsString } from 'class-validator';
import validateConfig from 'shared/lib/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;
}

export default registerAs('jwt', (): JwtModuleOptions => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    secret: process.env.JWT_SECRET || 'secret',
    signOptions: {
      expiresIn: process.env.JWT_EXPIRES_IN || '60s',
      algorithm: 'HS256',
    },
  };
});
