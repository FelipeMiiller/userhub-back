import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { IsString } from 'class-validator';
import validateConfig from 'shared/lib/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  REFRESH_JWT_SECRET: string;

  @IsString()
  REFRESH_JWT_EXPIRES_IN: string;
}

export default registerAs('refresh-jwt', (): JwtModuleOptions => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    secret: process.env.REFRESH_JWT_SECRET || 'secret',
    signOptions: {
      expiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '1d',
      algorithm: 'HS256',
    },
  };
});
