/*
https://docs.nestjs.com/modules
*/
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/common/loggers/logger.module';
import { UsersController } from './http/users.controller';
import { UsersService } from './domain/users.service';
import { BullModule } from '@nestjs/bullmq';
import { UsersTypeOrmRepository } from './domain/repositories/users.typeorm.repository';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';
import { ProfileEntity } from 'src/modules/users/domain/entities/profile.entities';
import { ProfilesService } from './domain/profiles.service';
import { PROFILES_REPOSITORY_TOKEN } from './domain/repositories/profiles.repository.interface';
import { ProfilesTypeOrmRepository } from './domain/repositories/profiles.typeorm.repository';
import { USERS_REPOSITORY_TOKEN } from './domain/repositories/users.repository.interface';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([UserEntity, ProfileEntity]),
    BullModule.registerQueue({ name: 'users' }),
  ],
  providers: [
    {
      provide: USERS_REPOSITORY_TOKEN,
      useClass: UsersTypeOrmRepository,
    },
    {
      provide: PROFILES_REPOSITORY_TOKEN,
      useClass: ProfilesTypeOrmRepository,
    },
    UsersService,
    ProfilesService,
  ],
  controllers: [UsersController],
  exports: [UsersService, ProfilesService],
})
export class UsersModule {}
