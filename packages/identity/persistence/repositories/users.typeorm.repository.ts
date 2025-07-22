import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserEntity } from '../entities/users.entities';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from 'shared/modules/persistence/typeorm/repository/default.repository';

@Injectable()
export class UsersRepository extends DefaultTypeOrmRepository<UserEntity> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(UserEntity, dataSource.manager);
  }

  async findOneByEmail(Email: string): Promise<UserEntity | null> {
    const userEntity = await this.findOne({ where: { Email } });
    if (!userEntity) {
      return null;
    }
    return userEntity;
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await this.update(id, { HashRefreshToken: refreshToken });
  }
}
