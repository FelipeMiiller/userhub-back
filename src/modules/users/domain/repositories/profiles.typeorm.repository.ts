import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseTypeOrmRepository } from 'src/common/shared/base-typeorm.repository';
import { ProfileEntity } from '../entities/profile.entities';
import { ProfilesRepository } from './profiles.repository.interface';

export class ProfilesTypeOrmRepository
  extends BaseTypeOrmRepository<ProfileEntity>
  implements ProfilesRepository
{
  constructor(
    @InjectRepository(ProfileEntity)
    usersRepository: Repository<ProfileEntity>,
  ) {
    super(usersRepository);
  }
}
