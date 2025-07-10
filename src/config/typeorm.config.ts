import { CreateUsersTable1723809312769 } from 'src/migrations/1723809312769-CreateUsersTable';
import { registerAs } from '@nestjs/config';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';
import { DataSourceOptions } from 'typeorm';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from 'src/common/utils/validate-config';

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

export default registerAs('typeorm', (): DataSourceOptions => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    type: 'postgres',
    host: process.env.TYPEORM_HOST,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    port: +process.env.TYPEORM_PORT || 5432,
    entities: [UserEntity],
    migrations: [CreateUsersTable1723809312769],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'test',
    migrationsRun: false,
    ssl: process.env.TYPEORM_SSL === 'true',
  };
});
