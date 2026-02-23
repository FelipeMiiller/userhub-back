import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Max, Min } from "class-validator";
import { DataSourceOptions } from "typeorm";
import { registerAs } from "@nestjs/config";
import { configValidator } from "@hub/shared-module/config";
import * as path from 'path'
import { Transform } from "class-transformer";


class EnvironmentVariablesValidator {
  @IsUrl()
  TYPEORM_HOST: string;

  @IsString()
  TYPEORM_USERNAME: string;

  @IsString()
  TYPEORM_PASSWORD: string;

  @IsString()
  TYPEORM_DATABASE: string;

  @Transform(({ value }) => (value ? parseInt(value, 10) : 5432))
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(65535)
  TYPEORM_PORT = 5432;


  @IsBoolean()
  @IsOptional()
  TYPEORM_SSL?: boolean;
}

export type TypeormConfig = DataSourceOptions;

export default registerAs('typeorm', (): TypeormConfig => {
 const config = configValidator(process.env, EnvironmentVariablesValidator);
  const entities = [path.join(__dirname, '..', '**', 'entities', '*.{ts,js}')];
  const migrations = [path.join(__dirname, '..', 'shared', 'persistence', 'migrations', '*.{ts,js}')];
  return {
    name: 'identity',
    type: 'postgres',
    host: config.TYPEORM_HOST,
    username: config.TYPEORM_USERNAME,
    password: config.TYPEORM_PASSWORD,
    database: config.TYPEORM_DATABASE,
    port: config.TYPEORM_PORT,
    entities,
    migrations,
    migrationsTableName: 'identity_migrations',
    synchronize: false,
    logging: process.env.NODE_ENV !== 'test',
    migrationsRun: false,
    ssl: process.env.TYPEORM_SSL === 'true',
  };
});
