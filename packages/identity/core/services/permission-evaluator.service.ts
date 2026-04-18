import { Injectable } from '@nestjs/common';
import {
  IPermissionEvaluator,
  PermissionEvaluationResult,
  parsePermission,
  permissionCovers,
} from '@hub/shared-module/authorization';
import { PermissionService } from './permission.service';
import { AccountTenantRepository } from '../../persistence/repository/account-tenant.typeorm.repository';
import { AccountTenantPermissionRepository } from '../../persistence/repository/account-tenant-permission.typeorm.repository';
import { TenantRolePermissionRepository } from '../../persistence/repository/tenant-role-permission.typeorm.repository';

@Injectable()
export class PermissionEvaluatorService implements IPermissionEvaluator {
  constructor(
    private readonly accountTenantRepository: AccountTenantRepository,
    private readonly accountTenantPermissionRepository: AccountTenantPermissionRepository,
    private readonly tenantRolePermissionRepository: TenantRolePermissionRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async evaluate(
    accountId: string,
    tenantId: string,
    permissionName: string,
  ): Promise<PermissionEvaluationResult> {
    const parsed = parsePermission(permissionName);
    if (!parsed) return { allowed: false, reason: 'invalid_permission_format' };

    const resourcePrefix = `${parsed.module}.${parsed.resource}.%`;

    const memberships = await this.accountTenantRepository.findMembershipsByAccountAndTenant(
      accountId,
      tenantId,
    );

    if (!memberships.length) {
      return { allowed: false, reason: 'no_membership' };
    }

    const accountTenantIds = memberships.map((m) => m.Id);

    const extraRows =
      await this.accountTenantPermissionRepository.findPermissionNamesByAccountTenants(
        accountTenantIds,
      );

    // deny explícito prevalece sobre tudo (match exato)
    const isExtraDenied = extraRows.some((r) => r.Mode === 'deny' && r.Name === permissionName);
    if (isExtraDenied) {
      return { allowed: false, reason: 'extra_deny' };
    }

    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean) as string[];

    const rows = await this.tenantRolePermissionRepository.findByRolesAndResourcePrefix(
      roleIds,
      resourcePrefix,
    );

    // deny de role: bloqueia se houver deny para o mesmo recurso com nível >= requerido
    const hasDeny = rows.some(
      (r) => r.Mode === 'deny' && permissionCovers(r.Name, permissionName),
    );
    if (hasDeny) {
      return { allowed: false, reason: 'role_deny' };
    }

    // Filtra rows que cobrem hierarquicamente a permissão solicitada
    const coveringRows = rows.filter(
      (r) => r.Mode === 'allow' && permissionCovers(r.Name, permissionName),
    );

    const hasExtraGrant = extraRows.some(
      (r) => r.Mode === 'grant' && permissionCovers(r.Name, permissionName),
    );

    if (!coveringRows.length && !hasExtraGrant) {
      return { allowed: false, reason: 'no_permission' };
    }

    const roleLevels = coveringRows.map((r) => r.AllowedLevel);
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
    const memberships = await this.accountTenantRepository.findMembershipsByAccountAndTenant(
      accountId,
      tenantId,
    );

    if (!memberships.length) return null;

    const accountTenantIds = memberships.map((m) => m.Id);
    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean) as string[];

    const [roleRows, extraRows] = await Promise.all([
      this.tenantRolePermissionRepository.findAllowedPermissionNamesByRoles(roleIds),
      this.accountTenantPermissionRepository.findPermissionNamesByAccountTenants(accountTenantIds),
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
    const memberships = await this.accountTenantRepository.findMembershipsByAccount(accountId);

    if (!memberships.length) return {};

    const accountTenantIds = memberships.map((m) => m.Id);
    const roleIds = memberships.map((m) => m.TenantRoleId).filter(Boolean) as string[];

    const [roleRows, extraRows] = await Promise.all([
      this.tenantRolePermissionRepository.findAllowedPermissionNamesByRoles(roleIds),
      this.accountTenantPermissionRepository.findPermissionNamesByAccountTenants(accountTenantIds),
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
