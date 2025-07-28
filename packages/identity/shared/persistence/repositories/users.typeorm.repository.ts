import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from 'shared/modules/persistence/typeorm/repository/default.repository';
import { User } from 'identity/shared/persistence/entities/users.entities';

@Injectable()
export class UsersRepository extends DefaultTypeOrmRepository<User> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(User, dataSource.manager);
  }

  async findOneByEmail(Email: string): Promise<User | null> {
    const userEntity = await this.findOne({ where: { Email } });
    if (!userEntity) {
      return null;
    }
    return userEntity;
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await this.update(id, { HashRefreshToken: refreshToken });
  }

  async resetPassword(id: string, password: string): Promise<void> {
    await this.update(id, { Password: password, HashRefreshToken: null });
  }
}
