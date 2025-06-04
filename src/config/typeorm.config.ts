import { registerAs } from '@nestjs/config';
import { CreateUsersTable1723809312769 } from 'src/migrations/1723809312769-CreateUsersTable';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';

export const config = {
  type: 'postgres',
  host: process.env.TYPEORM_HOST || 'localhost',
  username: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || 'postgres',
  database: process.env.TYPEORM_DATABASE || 'test_db',
  port: +process.env.TYPEORM_PORT || 5432,
  entities: [UserEntity],
  migrations: [CreateUsersTable1723809312769],
  synchronize:false,
  logging: process.env.NODE_ENV !== 'test',
  migrationsRun: false,

  ...(process.env.NODE_ENV === 'test'
    ? {
        dropSchema: false,
        keepConnectionAlive: false,
        maxQueryExecutionTime: 1000,
        extra: {
          poolSize: 5,
          max: 5,
        },
      }
    : {}),
};

export default registerAs('typeorm', () => config);
