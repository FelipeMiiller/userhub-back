import { registerAs } from '@nestjs/config';
import { IsOptional, IsString, IsNumberString, Max, Min } from 'class-validator';
import validateConfig from 'shared/lib/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  REDIS_HOST: string;

  @IsNumberString()
  @IsOptional()
  REDIS_PORT: string;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsNumberString()
  @IsOptional()
  REDIS_TTL: string;
}

export default registerAs('redis', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL, 10) || 60,
  };
});
