import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from '../entities/users.entities';
import { DefaultRepository } from 'src/common/typeorm/repository/default.repository';
import { UsersRepository } from './users.repository.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersTypeOrmRepository
  extends DefaultRepository<UserEntity>
  implements UsersRepository
{
  constructor(
    @InjectRepository(UserEntity)
    usersRepository: Repository<UserEntity>,
  ) {
    super(usersRepository);
  }
}
