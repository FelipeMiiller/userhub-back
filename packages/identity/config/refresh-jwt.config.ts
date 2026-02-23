import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { IsString, IsOptional } from 'class-validator';
import { configValidator } from '@hub/shared-module/config';
import { StringValue } from 'ms';

class EnvironmentVariablesValidator {
  @IsString()
  REFRESH_JWT_SECRET: string;

  @IsOptional()
  @IsString()
  REFRESH_JWT_EXPIRES_IN: StringValue = '1d';
}

export default registerAs('refresh-jwt', (): JwtModuleOptions => {
  const config = configValidator(process.env, EnvironmentVariablesValidator);
  return {
    secret: config.REFRESH_JWT_SECRET,
    signOptions: {
      expiresIn: config.REFRESH_JWT_EXPIRES_IN,
      algorithm: 'HS256',
    },
  };
});