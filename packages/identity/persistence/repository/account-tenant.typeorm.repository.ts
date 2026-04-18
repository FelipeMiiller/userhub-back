import { DataSource, EntityManager } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { PermissionLevel } from '@hub/shared-module/authorization';
import { AccountTenant } from '../entities/accountTenants.entities';
import { Tenant } from '../entities/tenants.entities';
import { TenantRole } from '../entities/tenantRoles.entities';
import { TenantRolePermission } from '../entities/tenantRolePermissions.entities';
import { Permission } from '../entities/permissions.entities';

export interface CreateTenantWithOwnerInput {
  AccountId: string;
  Name: string;
  Slug: string;
}

export interface TenantWithMembership {
  tenant: Tenant;
  membership: AccountTenant;
}

export interface MembershipDto {
  Id: string;
  TenantId: string;
  TenantRoleId: string | null;
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

  async findMembershipsByAccountAndTenant(
    accountId: string,
    tenantId: string,
  ): Promise<MembershipDto[]> {
    return this.dataSource.query(
      `SELECT "Id", "TenantId", "TenantRoleId" FROM "AccountTenants"
       WHERE "AccountId" = $1 AND "TenantId" = $2 AND "DeletedAt" IS NULL`,
      [accountId, tenantId],
    );
  }

  async findMembershipsByAccount(accountId: string): Promise<MembershipDto[]> {
    return this.dataSource.query(
      `SELECT "Id", "TenantId", "TenantRoleId" FROM "AccountTenants"
       WHERE "AccountId" = $1 AND "DeletedAt" IS NULL`,
      [accountId],
    );
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

      // Cria role admin para o tenant
      const adminRole = await manager.save(
        manager.create(TenantRole, {
          TenantId: tenant.Id,
          Name: 'Admin',
          Description: 'Administrador do tenant — permissão total',
        }),
      );

      // Busca todas as permissions e vincula ao role admin com nível ADMIN
      const allPermissions = await manager.find(Permission);

      if (allPermissions.length) {
        const rolePermissions = allPermissions.map((perm) =>
          manager.create(TenantRolePermission, {
            TenantRoleId: adminRole.Id,
            PermissionId: perm.Id,
            AllowedLevel: PermissionLevel.ADMIN,
            Mode: 'allow',
          }),
        );
        await manager.save(rolePermissions);
      }

      const membership = await manager.save(
        manager.create(AccountTenant, {
          AccountId: input.AccountId,
          TenantId: tenant.Id,
          TenantRoleId: adminRole.Id,
          Status: 'active',
        }),
      );

      return { tenant, membership };
    });
  }
}
