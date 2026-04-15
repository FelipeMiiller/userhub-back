import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import {
  AccountTenantPermission,
  AccountTenantPermissionMode,
} from '../entities/accountTenantPermissions.entities';

@Injectable()
export class AccountTenantPermissionRepository extends DefaultTypeOrmRepository<AccountTenantPermission> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(AccountTenantPermission, dataSource.manager);
  }

  async findAllByAccountTenant(accountTenantId: string): Promise<AccountTenantPermission[]> {
    return this.findMany({ where: { AccountTenantId: accountTenantId } });
  }

  async findByAccountTenantAndPermission(
    accountTenantId: string,
    permissionId: string,
    mode: AccountTenantPermissionMode,
  ): Promise<AccountTenantPermission | null> {
    return this.findOne({
      where: { AccountTenantId: accountTenantId, PermissionId: permissionId, Mode: mode },
    });
  }

  async grant(accountTenantId: string, permissionId: string): Promise<AccountTenantPermission> {
    return this.create({
      AccountTenantId: accountTenantId,
      PermissionId: permissionId,
      Mode: 'grant',
    });
  }

  async deny(accountTenantId: string, permissionId: string): Promise<AccountTenantPermission> {
    return this.create({
      AccountTenantId: accountTenantId,
      PermissionId: permissionId,
      Mode: 'deny',
    });
  }

  async removeByAccountTenantAndPermission(
    accountTenantId: string,
    permissionId: string,
    mode: AccountTenantPermissionMode,
  ): Promise<void> {
    const row = await this.findByAccountTenantAndPermission(accountTenantId, permissionId, mode);
    if (row) await this.delete(row.Id);
  }
}
