import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { TenantRolePermission } from '../entities/tenantRolePermissions.entities';

@Injectable()
export class TenantRolePermissionRepository extends DefaultTypeOrmRepository<TenantRolePermission> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(TenantRolePermission, dataSource.manager);
  }

  async findAllByRole(tenantRoleId: string): Promise<TenantRolePermission[]> {
    return this.findMany({ where: { TenantRoleId: tenantRoleId } });
  }
}
