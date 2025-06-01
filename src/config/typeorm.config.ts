import { registerAs } from '@nestjs/config';
import { CreateUsersTable1723809312769 } from 'src/migrations/1723809312769-CreateUsersTable';
import { ProfileEntity } from 'src/modules/users/domain/entities/profile.entities';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';

export const config = {
  type: 'postgres',
  host: process.env.TYPEORM_HOST || 'localhost',
  username: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || 'postgres',
  database: process.env.TYPEORM_DATABASE || 'testdb',
  port: +process.env.TYPEORM_PORT || 5432,
  entities: [UserEntity, ProfileEntity],
  migrations: [CreateUsersTable1723809312769],
  synchronize: false,
  logging: true,
  migrationsRun: true,
};

export default registerAs('typeorm', () => config);
