import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { Tenant } from '../entities/tenants.entities';

@Injectable()
export class TenantRepository extends DefaultTypeOrmRepository<Tenant> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(Tenant, dataSource.manager);
  }

  async findOneBySlug(slug: string): Promise<Tenant | null> {
    return this.findOne({ where: { Slug: slug } });
  }
}
