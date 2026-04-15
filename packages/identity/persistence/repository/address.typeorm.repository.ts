import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { Address } from '../entities/addresses.entities';

@Injectable()
export class AddressRepository extends DefaultTypeOrmRepository<Address> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(Address, dataSource.manager);
  }

  async findAllByProfile(profileId: string): Promise<Address[]> {
    return this.findMany({ where: { ProfileId: profileId } });
  }

  async findByIdAndProfile(id: string, profileId: string): Promise<Address | null> {
    return this.findOne({ where: { Id: id, ProfileId: profileId } });
  }
}
