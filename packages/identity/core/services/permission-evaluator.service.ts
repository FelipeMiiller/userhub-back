import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  IPermissionEvaluator,
  PermissionEvaluationResult,
} from '@hub/shared-module/authorization';
import { PermissionService } from './permission.service';

interface ExtraPermissions {
  grant?: string[];
  deny?: string[];
}

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
    const memberships: Array<{ TenantRoleId: string; ExtraPermissions: ExtraPermissions | null }> =
      await this.dataSource.query(
        `SELECT "TenantRoleId", "ExtraPermissions" FROM "AccountTenants" WHERE "AccountId" = $1 AND "TenantId" = $2`,
        [accountId, tenantId],
      );

    if (!memberships.length) {
      return { allowed: false, reason: 'no_membership' };
    }

    // ExtraPermissions deny on any membership wins immediately
    for (const membership of memberships) {
      const extra = membership.ExtraPermissions;
      if (extra?.deny?.includes(permissionName)) {
        return { allowed: false, reason: 'extra_deny' };
      }
    }

    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean);

    const rows: Array<{
      TenantRoleId: string;
      AllowedLevel: number;
      Mode: string;
    }> = roleIds.length
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

    // ExtraPermissions grant can satisfy even when no role row exists
    const hasExtraGrant = memberships.some((m) =>
      m.ExtraPermissions?.grant?.includes(permissionName),
    );

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
   * Combina permissões de role com ExtraPermissions.
   *
   * @returns array de permission names, ou null se o account não pertence ao tenant
   */
  async getAccountPermissions(accountId: string, tenantId: string): Promise<string[] | null> {
    const memberships: Array<{ TenantRoleId: string; ExtraPermissions: ExtraPermissions | null }> =
      await this.dataSource.query(
        `SELECT "TenantRoleId", "ExtraPermissions" FROM "AccountTenants" WHERE "AccountId" = $1 AND "TenantId" = $2`,
        [accountId, tenantId],
      );

    if (!memberships.length) return null;

    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean);

    const rows: Array<{ Name: string }> = roleIds.length
      ? await this.dataSource.query(
          `SELECT p."Name"
           FROM "TenantRolePermissions" trp
           JOIN "Permissions" p ON p."Id" = trp."PermissionId"
           WHERE trp."TenantRoleId" = ANY($1) AND trp."Mode" = 'allow'`,
          [roleIds],
        )
      : [];

    const extraGrants: string[] = [];
    const extraDenies: string[] = [];
    for (const m of memberships) {
      const extra = m.ExtraPermissions;
      if (extra?.grant) extraGrants.push(...extra.grant);
      if (extra?.deny) extraDenies.push(...extra.deny);
    }

    const all = new Set([...rows.map((r) => r.Name), ...extraGrants]);
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
    const memberships: Array<{ TenantId: string; TenantRoleId: string; ExtraPermissions: ExtraPermissions | null }> =
      await this.dataSource.query(
        `SELECT "TenantId", "TenantRoleId", "ExtraPermissions" FROM "AccountTenants" WHERE "AccountId" = $1`,
        [accountId],
      );

    if (!memberships.length) return {};

    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean);

    const roleRows: Array<{ TenantRoleId: string; Name: string }> = roleIds.length
      ? await this.dataSource.query(
          `SELECT trp."TenantRoleId", p."Name"
           FROM "TenantRolePermissions" trp
           JOIN "Permissions" p ON p."Id" = trp."PermissionId"
           WHERE trp."TenantRoleId" = ANY($1) AND trp."Mode" = 'allow'`,
          [roleIds],
        )
      : [];

    // Agrupa permissões de role por TenantRoleId
    const permsByRole = new Map<string, string[]>();
    for (const row of roleRows) {
      const list = permsByRole.get(row.TenantRoleId) ?? [];
      list.push(row.Name);
      permsByRole.set(row.TenantRoleId, list);
    }

    // Monta mapa por tenant combinando role + ExtraPermissions
    const result: Record<string, string[]> = {};
    for (const m of memberships) {
      const rolePerms = m.TenantRoleId ? (permsByRole.get(m.TenantRoleId) ?? []) : [];
      const grants = m.ExtraPermissions?.grant ?? [];
      const denies = new Set(m.ExtraPermissions?.deny ?? []);

      const all = new Set([...rolePerms, ...grants]);
      for (const deny of denies) all.delete(deny);

      result[m.TenantId] = [...all];
    }

    return result;
  }
}

