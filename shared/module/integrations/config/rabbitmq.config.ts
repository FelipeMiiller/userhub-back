import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsOptional,
  Min,
  Max,
  IsUrl,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { configValidator } from '../../config/util/config.validator';


export class EnvironmentVariablesValidator {
  @IsUrl()
  RABBITMQ_HOST: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 5672))
  @IsInt()
  @Min(0)
  @Max(65535)
  RABBITMQ_PORT = 5672;

  @IsString()
  RABBITMQ_USERNAME: string;

  @IsOptional()
  @IsString()
  RABBITMQ_PASSWORD?: string;

  @IsOptional() // Adicionado IsOptional pois você usa vhost || '/'
  @IsString()
  RABBITMQ_VHOST= '/';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  RABBITMQ_PERSISTENT= true;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 60))
  @IsInt()
  RABBITMQ_HEARTBEAT= 60;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  @IsInt()
  RABBITMQ_PREFETCH_COUNT= 10;
}

export default registerAs('rabbitmq', (): RabbitMQConfig => {

  const validatedConfig = configValidator(process.env, EnvironmentVariablesValidator);


  const {
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USERNAME,
    RABBITMQ_PASSWORD,
    RABBITMQ_VHOST,
    RABBITMQ_PERSISTENT,
    RABBITMQ_HEARTBEAT,
    RABBITMQ_PREFETCH_COUNT,
  } = validatedConfig;

  return {
    host: RABBITMQ_HOST,
    port: RABBITMQ_PORT,
    username: RABBITMQ_USERNAME,
    password: RABBITMQ_PASSWORD,
    vhost: RABBITMQ_VHOST,
    persistent: RABBITMQ_PERSISTENT,
    heartbeat: RABBITMQ_HEARTBEAT,
    prefetchCount: RABBITMQ_PREFETCH_COUNT,
    uri: `amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`,
  };
});

export type RabbitMQConfig = {
  host: string;
  port: number;
  username: string;
  password?: string;
  uri: string;
  vhost: string;
  persistent: boolean;
  heartbeat: number;
  prefetchCount: number;
};