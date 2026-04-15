import { DataSource, EntityManager } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { Account } from '../entities/accounts.entities';
import { Profile } from '../entities/profiles.entities';
import { Address } from '../entities/addresses.entities';
import { AccountTenant } from '../entities/accountTenants.entities';
import { Tenant } from '../entities/tenants.entities';
import { TenantRolePermission } from '../entities/tenantRolePermissions.entities';
import { Permission } from '../entities/permissions.entities';
import { SystemModule } from '../entities/modules.entities';

interface RawMeRow {
  aId: string;
  aEmail: string;
  aProvider: string;
  aEmailVerified: boolean;
  aStatus: boolean;
  aCreatedAt: Date;
  pId: string | null;
  pFirstName: string | null;
  pLastName: string | null;
  pPhoto: string | null;
  atId: string | null;
  atTenantId: string | null;
  atTenantRoleId: string | null;
  atStatus: string | null;
  tId: string | null;
  tName: string | null;
  tSlug: string | null;
  tStatus: string | null;
  trpPermissionId: string | null;
  trpAllowedLevel: number | null;
  trpMode: string | null;
  permName: string | null;
  permAction: string | null;
  modSlug: string | null;
}

export interface AccountMeProjection {
  Id: string;
  Email: string;
  Provider: string;
  EmailVerified: boolean;
  Status: boolean;
  CreatedAt: Date;
  profile: { Id: string; FirstName: string; LastName: string | null; Photo: string | null } | null;
  tenants: Array<{
    Id: string;
    TenantId: string;
    TenantRoleId: string | null;
    Status: string;
    tenant: { Id: string; Name: string; Slug: string; Status: string } | null;
    permissions: Record<
      string,
      Array<{ name: string; action: string; allowedLevel: number; mode: string }>
    >;
  }>;
}

export interface CreateAccountWithProfileInput {
  Email: string;
  Password: string;
  Provider: string;
  HashRefreshToken: string | null;
  EmailVerified: boolean;
  Status: boolean;
  FirstName: string;
  LastName: string | null;
  Photo: string | null;
}

@Injectable()
export class AccountRepository extends DefaultTypeOrmRepository<Account> {
  constructor(
    @InjectDataSource('identity')
    private readonly dataSource: DataSource,
  ) {
    super(Account, dataSource.manager);
  }

  async findOneByEmail(email: string): Promise<Account | null> {
    return this.findOne({ where: { Email: email } });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.update(id, { HashRefreshToken: refreshToken });
  }

  async resetPassword(id: string, password: string): Promise<void> {
    await this.update(id, { Password: password, HashRefreshToken: null });
  }

  async deleteWithCascade(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Soft delete memberships do account
      await manager.softDelete(AccountTenant, { AccountId: id });

      // 2. Soft delete profile e seus endereços
      const profile = await manager.findOne(Profile, { where: { AccountId: id } });
      if (profile) {
        await manager.softDelete(Address, { ProfileId: profile.Id });
        await manager.softDelete(Profile, { Id: profile.Id });
      }

      // 3. Soft delete do account
      await manager.softDelete(Account, { Id: id });
    });
  }

  async createWithProfile(input: CreateAccountWithProfileInput): Promise<Account> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const account = await manager.save(
        manager.create(Account, {
          Email: input.Email,
          Password: input.Password,
          Provider: input.Provider,
          HashRefreshToken: input.HashRefreshToken,
          EmailVerified: input.EmailVerified,
          Status: input.Status,
        }),
      );

      await manager.save(
        manager.create(Profile, {
          FirstName: input.FirstName,
          LastName: input.LastName,
          Photo: input.Photo,
          AccountId: account.Id,
        }),
      );

      return account;
    });
  }

  async findMeById(id: string): Promise<AccountMeProjection | null> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select([
        'a."Id" as "aId"',
        'a."Email" as "aEmail"',
        'a."Provider" as "aProvider"',
        'a."EmailVerified" as "aEmailVerified"',
        'a."Status" as "aStatus"',
        'a."CreatedAt" as "aCreatedAt"',
        'p."Id" as "pId"',
        'p."FirstName" as "pFirstName"',
        'p."LastName" as "pLastName"',
        'p."Photo" as "pPhoto"',
        'at."Id" as "atId"',
        'at."TenantId" as "atTenantId"',
        'at."TenantRoleId" as "atTenantRoleId"',
        'at."Status" as "atStatus"',
        't."Id" as "tId"',
        't."Name" as "tName"',
        't."Slug" as "tSlug"',
        't."Status" as "tStatus"',
        'trp."PermissionId" as "trpPermissionId"',
        'trp."AllowedLevel" as "trpAllowedLevel"',
        'trp."Mode" as "trpMode"',
        'perm."Name" as "permName"',
        'perm."Action" as "permAction"',
        'mod."Slug" as "modSlug"',
      ])
      .from(Account, 'a')
      .leftJoin(Profile, 'p', 'p."AccountId" = a."Id" AND p."DeletedAt" IS NULL')
      .leftJoin(AccountTenant, 'at', 'at."AccountId" = a."Id" AND at."DeletedAt" IS NULL')
      .leftJoin(Tenant, 't', 't."Id" = at."TenantId" AND t."DeletedAt" IS NULL')
      .leftJoin(
        TenantRolePermission,
        'trp',
        'trp."TenantRoleId" = at."TenantRoleId" AND trp."DeletedAt" IS NULL',
      )
      .leftJoin(Permission, 'perm', 'perm."Id" = trp."PermissionId" AND perm."DeletedAt" IS NULL')
      .leftJoin(SystemModule, 'mod', 'mod."Id" = perm."ModuleId" AND mod."DeletedAt" IS NULL')
      .where('a."Id" = :id AND a."DeletedAt" IS NULL', { id })
      .getRawMany<RawMeRow>();

    if (rows.length === 0) return null;

    const first = rows[0];

    const tenantMap = new Map<string, AccountMeProjection['tenants'][number]>();

    for (const row of rows) {
      if (!row.atId) continue;

      if (!tenantMap.has(row.atId)) {
        tenantMap.set(row.atId, {
          Id: row.atId,
          TenantId: row.atTenantId!,
          TenantRoleId: row.atTenantRoleId,
          Status: row.atStatus!,
          tenant: row.tId
            ? { Id: row.tId, Name: row.tName!, Slug: row.tSlug!, Status: row.tStatus! }
            : null,
          permissions: {},
        });
      }

      if (row.modSlug && row.permName) {
        const entry = tenantMap.get(row.atId)!;
        if (!entry.permissions[row.modSlug]) entry.permissions[row.modSlug] = [];
        entry.permissions[row.modSlug].push({
          name: row.permName,
          action: row.permAction!,
          allowedLevel: row.trpAllowedLevel!,
          mode: row.trpMode!,
        });
      }
    }

    return {
      Id: first.aId,
      Email: first.aEmail,
      Provider: first.aProvider,
      EmailVerified: first.aEmailVerified,
      Status: first.aStatus,
      CreatedAt: first.aCreatedAt,
      profile: first.pId
        ? {
            Id: first.pId,
            FirstName: first.pFirstName!,
            LastName: first.pLastName,
            Photo: first.pPhoto,
          }
        : null,
      tenants: [...tenantMap.values()],
    };
  }
}
