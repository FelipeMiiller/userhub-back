import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { Permission } from '../entities/permissions.entities';

@Injectable()
export class PermissionRepository extends DefaultTypeOrmRepository<Permission> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(Permission, dataSource.manager);
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.findOne({ where: { Name: name } });
  }

  async findAllByModule(moduleId: string): Promise<Permission[]> {
    return this.findMany({ where: { ModuleId: moduleId } });
  }

  async findAllByResource(resourceId: string): Promise<Permission[]> {
    return this.findMany({ where: { ResourceId: resourceId } });
  }
}
