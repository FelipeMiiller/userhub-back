import { registerAs } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { IsString } from 'class-validator';
import { configValidator } from '../../config/util/config.validator';

class EnvironmentVariablesValidator {
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;
}

export default registerAs('jwt', (): JwtModuleOptions => {
  configValidator(process.env, EnvironmentVariablesValidator);
  return {
    secret: process.env.JWT_SECRET || 'secret',
    signOptions: {
      expiresIn: (process.env.JWT_EXPIRES_IN || '60s') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      algorithm: 'HS256',
    },
  };
});
