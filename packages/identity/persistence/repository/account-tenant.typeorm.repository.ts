import { DataSource, EntityManager } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { AccountTenant } from '../entities/accountTenants.entities';
import { Tenant } from '../entities/tenants.entities';

export interface CreateTenantWithOwnerInput {
  AccountId: string;
  Name: string;
  Slug: string;
}

export interface TenantWithMembership {
  tenant: Tenant;
  membership: AccountTenant;
}

@Injectable()
export class AccountTenantRepository extends DefaultTypeOrmRepository<AccountTenant> {
  constructor(
    @InjectDataSource('identity')
    private readonly dataSource: DataSource,
  ) {
    super(AccountTenant, dataSource.manager);
  }

  async findOneByAccountAndTenant(
    accountId: string,
    tenantId: string,
  ): Promise<AccountTenant | null> {
    return this.findOne({ where: { AccountId: accountId, TenantId: tenantId } });
  }

  async findAllByAccount(accountId: string): Promise<AccountTenant[]> {
    return this.findMany({ where: { AccountId: accountId } });
  }

  async findAllByTenant(tenantId: string): Promise<AccountTenant[]> {
    return this.findMany({ where: { TenantId: tenantId } });
  }

  async createTenantWithOwner(input: CreateTenantWithOwnerInput): Promise<TenantWithMembership> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const tenant = await manager.save(
        manager.create(Tenant, {
          Name: input.Name,
          Slug: input.Slug,
          Status: 'active',
        }),
      );

      const membership = await manager.save(
        manager.create(AccountTenant, {
          AccountId: input.AccountId,
          TenantId: tenant.Id,
          Status: 'active',
        }),
      );

      return { tenant, membership };
    });
  }
}
