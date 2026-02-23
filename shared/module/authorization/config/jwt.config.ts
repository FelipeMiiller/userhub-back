import { registerAs } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { IsString } from 'class-validator';
import ConfigValidator from '@hub/shared-lib/core/validators/config.validator';

class EnvironmentVariablesValidator {
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;
}

export default registerAs('jwt', (): JwtModuleOptions => {
  ConfigValidator(process.env, EnvironmentVariablesValidator);
  return {
    secret: process.env.JWT_SECRET || 'secret',
    signOptions: {
      expiresIn: process.env.JWT_EXPIRES_IN || '60s',
      algorithm: 'HS256',
    },
  };
});
