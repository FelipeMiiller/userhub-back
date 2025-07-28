import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  IsAlphanumeric,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { registerAs } from '@nestjs/config';
import validateConfig from 'shared/lib/utils/validate-config';

export class EnvironmentVariablesValidator {
  @IsOptional()
  @IsString()
  RABBITMQ_HOST?: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  RABBITMQ_PORT: number;

  @IsOptional()
  @IsString()
  RABBITMQ_USERNAME: string;

  @IsOptional()
  @IsString()
  RABBITMQ_PASSWOR: string;

  @IsOptional()
  @IsString()
  RABBITMQ_VHOST?: string;

  @IsOptional()
  @IsBoolean()
  RABBITMQ_PERSISTENT: boolean;

  @IsOptional()
  @IsInt()
  RABBITMQ_HEARTBEAT: number;

  @IsOptional()
  @IsInt()
  RABBITMQ_PREFETCH_COUNT: number;
}

export default registerAs('rabbitmq', (): RabbitMQConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT, 10) || 5672,
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    uri: `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
    vhost: process.env.RABBITMQ_VHOST || '/',
    persistent: process.env.RABBITMQ_PERSISTENT === 'true',
    heartbeat: parseInt(process.env.RABBITMQ_HEARTBEAT, 10) || 60,
    prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT, 10) || 10,
  };
});

export type RabbitMQConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  uri: string;
  vhost: string;
  persistent: boolean;
  heartbeat: number;
  prefetchCount: number;
};
