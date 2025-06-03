import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource, DataSourceOptions } from 'typeorm';
import { CreateUsersTable1723809312769 } from './1723809312769-CreateUsersTable';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';

export const config = {
  type: 'postgres',
  host: process.env.TYPEORM_HOST,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  port: +process.env.TYPEORM_PORT,
  entities: [UserEntity],
  migrations: [CreateUsersTable1723809312769],
  synchronize: false,
  logging: true,
  migrationsRun: true,
};

export const AppDataSource = new DataSource(config as DataSourceOptions);
