import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { TenantRolePermission } from '../entities/tenantRolePermissions.entities';

export interface RolePermissionNameRow {
  TenantRoleId: string;
  Name: string;
}

export interface RolePermissionDetailRow {
  TenantRoleId: string;
  AllowedLevel: number;
  Mode: string;
  Name: string;
}

@Injectable()
export class TenantRolePermissionRepository extends DefaultTypeOrmRepository<TenantRolePermission> {
  constructor(
    @InjectDataSource('identity')
    private readonly dataSource: DataSource,
  ) {
    super(TenantRolePermission, dataSource.manager);
  }

  async findAllByRole(tenantRoleId: string): Promise<TenantRolePermission[]> {
    return this.findMany({ where: { TenantRoleId: tenantRoleId } });
  }

  async findAllowedPermissionNamesByRoles(roleIds: string[]): Promise<RolePermissionNameRow[]> {
    if (!roleIds.length) return [];
    return this.dataSource.query(
      `SELECT trp."TenantRoleId", p."Name"
       FROM "TenantRolePermissions" trp
       JOIN "Permissions" p ON p."Id" = trp."PermissionId"
       WHERE trp."TenantRoleId" = ANY($1) AND trp."Mode" = 'allow'`,
      [roleIds],
    );
  }

  async findByRolesAndResourcePrefix(
    roleIds: string[],
    resourcePrefix: string,
  ): Promise<RolePermissionDetailRow[]> {
    if (!roleIds.length) return [];
    return this.dataSource.query(
      `SELECT trp."TenantRoleId", trp."AllowedLevel", trp."Mode", p."Name"
       FROM "TenantRolePermissions" trp
       JOIN "Permissions" p ON p."Id" = trp."PermissionId"
       WHERE trp."TenantRoleId" = ANY($1) AND p."Name" LIKE $2`,
      [roleIds, resourcePrefix],
    );
  }
}
