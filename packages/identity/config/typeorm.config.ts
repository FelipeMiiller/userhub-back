import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from 'shared/lib/utils/validate-config';
import { User } from 'packages/identity/shared/persistence/entities/users.entities';
import { CreateUsersTable1723809312769 } from '../shared/persistence/migrations/1723809312769-CreateUsersTable';

class EnvironmentVariablesValidator {
  @IsString()
  TYPEORM_HOST: string;

  @IsString()
  TYPEORM_USERNAME: string;

  @IsString()
  TYPEORM_PASSWORD: string;

  @IsString()
  TYPEORM_DATABASE: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  TYPEORM_PORT: number;

  @IsBoolean()
  @IsOptional()
  TYPEORM_SSL: boolean;
}

export type TypeormConfig = DataSourceOptions;

export default registerAs('typeorm', (): TypeormConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    name: 'identity',
    type: 'postgres',
    host: process.env.TYPEORM_HOST,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    port: parseInt(process.env.TYPEORM_PORT, 10) || 5432,
    entities: [User],
    migrations: [CreateUsersTable1723809312769],
    migrationsTableName: 'identity_migrations',
    synchronize: false,
    logging: process.env.NODE_ENV !== 'test',
    migrationsRun: false,
    ssl: process.env.TYPEORM_SSL === 'true',
  };
});
