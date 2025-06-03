import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from '../entities/users.entities';
import { BaseTypeOrmRepository } from 'src/common/shared/base-typeorm.repository';
import { UsersRepository } from './users.repository.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersTypeOrmRepository
  extends BaseTypeOrmRepository<UserEntity>
  implements UsersRepository
{
  constructor(
    @InjectRepository(UserEntity)
    usersRepository: Repository<UserEntity>,
  ) {
    super(usersRepository);
  }
}
