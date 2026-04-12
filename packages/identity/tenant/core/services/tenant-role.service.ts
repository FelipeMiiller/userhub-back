import { Injectable } from '@nestjs/common';
import { TenantRole } from '../../../persistence/entities/tenantRoles.entities';
import { TenantRoleRepository } from '../../../persistence/repository/tenant-role.typeorm.repository';
import { TenantRolePermission } from '../../../persistence/entities/tenantRolePermissions.entities';
import { TenantRolePermissionRepository } from '../../../persistence/repository/tenant-role-permission.typeorm.repository';

@Injectable()
export class TenantRoleService {
  constructor(
    private readonly tenantRoleRepository: TenantRoleRepository,
    private readonly tenantRolePermissionRepository: TenantRolePermissionRepository,
  ) {}

  async findAllByTenant(tenantId: string): Promise<TenantRole[]> {
    return this.tenantRoleRepository.findAllByTenant(tenantId);
  }

  async findOneById(id: string): Promise<TenantRole | null> {
    return this.tenantRoleRepository.findOneById(id);
  }

  async create(data: Partial<TenantRole>): Promise<TenantRole> {
    return this.tenantRoleRepository.create(data);
  }

  async update(id: string, data: Partial<TenantRole>): Promise<TenantRole | null> {
    return this.tenantRoleRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.tenantRoleRepository.delete(id);
  }

  async findPermissions(tenantRoleId: string): Promise<TenantRolePermission[]> {
    return this.tenantRolePermissionRepository.findAllByRole(tenantRoleId);
  }

  async addPermission(
    tenantRoleId: string,
    permissionId: string,
    allowedLevel = 1,
    mode: 'allow' | 'deny' = 'allow',
  ): Promise<TenantRolePermission> {
    return this.tenantRolePermissionRepository.create({
      TenantRoleId: tenantRoleId,
      PermissionId: permissionId,
      AllowedLevel: allowedLevel,
      Mode: mode,
    });
  }

  async removePermission(id: string): Promise<void> {
    return this.tenantRolePermissionRepository.delete(id);
  }
}
