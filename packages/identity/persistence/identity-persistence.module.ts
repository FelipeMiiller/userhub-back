import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './repositories/users.typeorm.repository';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeormConfig, { TypeormConfig } from 'packages/identity/config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forFeature(typeormConfig),
    TypeOrmModule.forRootAsync({
      name: 'identity',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get<TypeormConfig>('typeorm'),
    }),
  ],
  providers: [UsersRepository],

  exports: [UsersRepository],
})
export class IdentityPersistenceModule {}
