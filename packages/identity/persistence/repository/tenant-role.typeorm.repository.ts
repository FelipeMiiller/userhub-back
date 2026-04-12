import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { TenantRole } from '../entities/tenantRoles.entities';

@Injectable()
export class TenantRoleRepository extends DefaultTypeOrmRepository<TenantRole> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(TenantRole, dataSource.manager);
  }

  async findAllByTenant(tenantId: string): Promise<TenantRole[]> {
    return this.findMany({ where: { TenantId: tenantId } });
  }
}
