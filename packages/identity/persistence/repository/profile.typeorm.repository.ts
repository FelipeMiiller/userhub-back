import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { Profile } from '../entities/profiles.entities';

@Injectable()
export class ProfileRepository extends DefaultTypeOrmRepository<Profile> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(Profile, dataSource.manager);
  }

  async findOneByAccountId(accountId: string): Promise<Profile | null> {
    return this.findOne({ where: { AccountId: accountId } });
  }

  async updateByAccountId(accountId: string, data: Partial<Profile>): Promise<void> {
    await this.manager.connection.transaction(async (manager) => {
      const profile = await manager.findOne(Profile, { where: { AccountId: accountId } });
      if (!profile) {
        throw new Error('Profile not found');
      }
      await manager.update(Profile, { Id: profile.Id }, data);
    });
  }
}
