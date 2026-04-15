import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { IPermissionEvaluator, PermissionEvaluationResult } from '@hub/shared-module/authorization';
import { PermissionService } from './permission.service';

@Injectable()
export class PermissionEvaluatorService implements IPermissionEvaluator {
  constructor(
    @InjectDataSource('identity') private readonly dataSource: DataSource,
    private readonly permissionService: PermissionService,
  ) {}

  async evaluate(
    accountId: string,
    tenantId: string,
    permissionName: string,
  ): Promise<PermissionEvaluationResult> {
    const memberships: Array<{ Id: string; TenantRoleId: string | null }> =
      await this.dataSource.query(
        `SELECT "Id", "TenantRoleId" FROM "AccountTenants"
         WHERE "AccountId" = $1 AND "TenantId" = $2 AND "DeletedAt" IS NULL`,
        [accountId, tenantId],
      );

    if (!memberships.length) {
      return { allowed: false, reason: 'no_membership' };
    }

    const accountTenantIds = memberships.map((m) => m.Id);

    // ExtraPermissions via AccountTenantPermissions table
    const extraRows: Array<{ Name: string; Mode: string }> = await this.dataSource.query(
      `SELECT p."Name", atp."Mode"
       FROM "AccountTenantPermissions" atp
       JOIN "Permissions" p ON p."Id" = atp."PermissionId"
       WHERE atp."AccountTenantId" = ANY($1) AND atp."DeletedAt" IS NULL`,
      [accountTenantIds],
    );

    // deny explícito prevalece sobre tudo
    const isExtraDenied = extraRows.some((r) => r.Mode === 'deny' && r.Name === permissionName);
    if (isExtraDenied) {
      return { allowed: false, reason: 'extra_deny' };
    }

    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean) as string[];

    const rows: Array<{ TenantRoleId: string; AllowedLevel: number; Mode: string }> = roleIds.length
      ? await this.dataSource.query(
          `SELECT trp."TenantRoleId", trp."AllowedLevel", trp."Mode"
           FROM "TenantRolePermissions" trp
           JOIN "Permissions" p ON p."Id" = trp."PermissionId"
           WHERE trp."TenantRoleId" = ANY($1) AND p."Name" = $2`,
          [roleIds, permissionName],
        )
      : [];

    const hasDeny = rows.some((r) => r.Mode === 'deny');
    if (hasDeny) {
      return { allowed: false, reason: 'role_deny' };
    }

    const hasExtraGrant = extraRows.some((r) => r.Mode === 'grant' && r.Name === permissionName);

    if (!rows.length && !hasExtraGrant) {
      return { allowed: false, reason: 'no_permission' };
    }

    const roleLevels = rows.map((r) => r.AllowedLevel);
    const maxLevel = roleLevels.length ? Math.max(...roleLevels) : 1;

    if (!this.permissionService.isAllowed('allow', maxLevel)) {
      return { allowed: false, reason: 'insufficient_level' };
    }

    return { allowed: true, effectiveLevel: maxLevel };
  }

  /**
   * Retorna todas as permissions que um account possui em um tenant específico.
   * Combina permissões de role com AccountTenantPermissions (grant − deny).
   *
   * @returns array de permission names, ou null se o account não pertence ao tenant
   */
  async getAccountPermissions(accountId: string, tenantId: string): Promise<string[] | null> {
    const memberships: Array<{ Id: string; TenantRoleId: string | null }> =
      await this.dataSource.query(
        `SELECT "Id", "TenantRoleId" FROM "AccountTenants"
         WHERE "AccountId" = $1 AND "TenantId" = $2 AND "DeletedAt" IS NULL`,
        [accountId, tenantId],
      );

    if (!memberships.length) return null;

    const accountTenantIds = memberships.map((m) => m.Id);
    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean) as string[];

    const [roleRows, extraRows]: [Array<{ Name: string }>, Array<{ Name: string; Mode: string }>] =
      await Promise.all([
        roleIds.length
          ? this.dataSource.query(
              `SELECT p."Name"
               FROM "TenantRolePermissions" trp
               JOIN "Permissions" p ON p."Id" = trp."PermissionId"
               WHERE trp."TenantRoleId" = ANY($1) AND trp."Mode" = 'allow'`,
              [roleIds],
            )
          : Promise.resolve([]),
        this.dataSource.query(
          `SELECT p."Name", atp."Mode"
           FROM "AccountTenantPermissions" atp
           JOIN "Permissions" p ON p."Id" = atp."PermissionId"
           WHERE atp."AccountTenantId" = ANY($1) AND atp."DeletedAt" IS NULL`,
          [accountTenantIds],
        ),
      ]);

    const extraGrants = extraRows.filter((r) => r.Mode === 'grant').map((r) => r.Name);
    const extraDenies = new Set(extraRows.filter((r) => r.Mode === 'deny').map((r) => r.Name));

    const all = new Set([...roleRows.map((r) => r.Name), ...extraGrants]);
    for (const deny of extraDenies) all.delete(deny);

    return [...all];
  }

  /**
   * Retorna o mapa completo de todos os tenants do account com suas permissões.
   * Embutido no token JWT no momento do login.
   *
   * @returns { [tenantId]: permissionNames[] }
   */
  async getAllTenantsPermissions(accountId: string): Promise<Record<string, string[]>> {
    const memberships: Array<{ Id: string; TenantId: string; TenantRoleId: string | null }> =
      await this.dataSource.query(
        `SELECT "Id", "TenantId", "TenantRoleId" FROM "AccountTenants"
         WHERE "AccountId" = $1 AND "DeletedAt" IS NULL`,
        [accountId],
      );

    if (!memberships.length) return {};

    const accountTenantIds = memberships.map((m) => m.Id);
    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean) as string[];

    const [roleRows, extraRows]: [
      Array<{ TenantRoleId: string; Name: string }>,
      Array<{ AccountTenantId: string; Name: string; Mode: string }>,
    ] = await Promise.all([
      roleIds.length
        ? this.dataSource.query(
            `SELECT trp."TenantRoleId", p."Name"
             FROM "TenantRolePermissions" trp
             JOIN "Permissions" p ON p."Id" = trp."PermissionId"
             WHERE trp."TenantRoleId" = ANY($1) AND trp."Mode" = 'allow'`,
            [roleIds],
          )
        : Promise.resolve([]),
      this.dataSource.query(
        `SELECT atp."AccountTenantId", p."Name", atp."Mode"
         FROM "AccountTenantPermissions" atp
         JOIN "Permissions" p ON p."Id" = atp."PermissionId"
         WHERE atp."AccountTenantId" = ANY($1) AND atp."DeletedAt" IS NULL`,
        [accountTenantIds],
      ),
    ]);

    // Agrupa permissões de role por TenantRoleId
    const permsByRole = new Map<string, string[]>();
    for (const row of roleRows) {
      const list = permsByRole.get(row.TenantRoleId) ?? [];
      list.push(row.Name);
      permsByRole.set(row.TenantRoleId, list);
    }

    // Agrupa extra permissions por AccountTenantId
    const extraByMembership = new Map<string, { grants: string[]; denies: Set<string> }>();
    for (const row of extraRows) {
      const entry = extraByMembership.get(row.AccountTenantId) ?? { grants: [], denies: new Set() };
      if (row.Mode === 'grant') entry.grants.push(row.Name);
      else entry.denies.add(row.Name);
      extraByMembership.set(row.AccountTenantId, entry);
    }

    // Monta mapa por tenant combinando role + AccountTenantPermissions
    const result: Record<string, string[]> = {};
    for (const m of memberships) {
      const rolePerms = m.TenantRoleId ? (permsByRole.get(m.TenantRoleId) ?? []) : [];
      const extra = extraByMembership.get(m.Id) ?? { grants: [], denies: new Set<string>() };

      const all = new Set([...rolePerms, ...extra.grants]);
      for (const deny of extra.denies) all.delete(deny);

      result[m.TenantId] = [...all];
    }

    return result;
  }
}
