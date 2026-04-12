import { IsEnum, IsOptional, IsUrl, IsString, IsNumberString } from 'class-validator';
import { configValidator } from './config.validator';


enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export type SharedConfig = {
  environment: Environment;
  identityApi: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    ttl: number;
  };
};

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsUrl()
  IDENTITY_API_URL: string;

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
export const sharedConfigFactory = (): SharedConfig => {
  configValidator<EnvironmentVariablesValidator>(process.env, EnvironmentVariablesValidator);
  return {
    environment: process.env.NODE_ENV as Environment,
    identityApi: {
      url: process.env.IDENTITY_API_URL as string,
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || '',
      ttl: parseInt(process.env.REDIS_TTL || '60', 10),
    },
  };
};
