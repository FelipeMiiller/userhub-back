import { Injectable } from '@nestjs/common';
import { Permission } from '../../../persistence/entities/permissions.entities';
import { PermissionRepository } from '../../../persistence/repository/permission.typeorm.repository';
import { SystemModuleRepository } from '../../../persistence/repository/system-module.typeorm.repository';
import { SystemResourceRepository } from '../../../persistence/repository/system-resource.typeorm.repository';

@Injectable()
export class PermissionCatalogService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly systemModuleRepository: SystemModuleRepository,
    private readonly systemResourceRepository: SystemResourceRepository,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.findMany({});
  }

  async findOneById(id: string): Promise<Permission | null> {
    return this.permissionRepository.findOneById(id);
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findByName(name);
  }

  async create(data: {
    ModuleId: string;
    ResourceId: string;
    Action: string;
    Description?: string;
  }): Promise<Permission> {
    const mod = await this.systemModuleRepository.findOneById(data.ModuleId);
    const res = await this.systemResourceRepository.findOneById(data.ResourceId);

    if (!mod || !res) {
      throw new Error('ModuleId or ResourceId not found');
    }

    const name = `${mod.Slug}.${res.Slug}.${data.Action}`;

    return this.permissionRepository.create({
      Name: name,
      ModuleId: data.ModuleId,
      ResourceId: data.ResourceId,
      Action: data.Action,
      Description: data.Description ?? null,
    });
  }

  async delete(id: string): Promise<void> {
    return this.permissionRepository.delete(id);
  }
}
