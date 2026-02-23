import { TypeOrmModule } from '@nestjs/typeorm';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeormConfig, { TypeormConfig } from '../config/typeorm.config';
import { UsersRepository } from './repository/users.typeorm.repository';

@Global()
@Module({
    imports: [
        ConfigModule.forFeature(typeormConfig),
        TypeOrmModule.forRootAsync({
            name: 'identity',
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) =>
                configService.get('typeorm') as TypeormConfig,
        }),
    ],
    providers: [UsersRepository],

    exports: [UsersRepository],
})
export class IdentityPersistenceModule { }
