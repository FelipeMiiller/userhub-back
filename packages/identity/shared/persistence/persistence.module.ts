import { TypeOrmModule } from '@nestjs/typeorm';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeormConfig, { TypeormConfig } from 'packages/identity/config/typeorm.config';
import { UsersRepository } from './repositories/users.typeorm.repository';

@Global()
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
