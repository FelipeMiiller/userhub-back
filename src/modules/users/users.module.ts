import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/common/loggers/logger.module';
import { UsersController } from './http/users.controller';
import { UsersService } from './domain/users.service';
import { UsersTypeOrmRepository } from './domain/repositories/users.typeorm.repository';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';
import { MailModule } from 'src/common/mail/mail.module';
import { USERS_REPOSITORY_TOKEN } from './domain/repositories/users.repository.interface';

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([UserEntity]), MailModule],
  providers: [
    {
      provide: USERS_REPOSITORY_TOKEN,
      useClass: UsersTypeOrmRepository,
    },
    UsersService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
