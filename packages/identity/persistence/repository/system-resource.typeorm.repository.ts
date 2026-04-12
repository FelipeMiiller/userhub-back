import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { SystemResource } from '../entities/resources.entities';

@Injectable()
export class SystemResourceRepository extends DefaultTypeOrmRepository<SystemResource> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(SystemResource, dataSource.manager);
  }

  async findBySlugAndModule(slug: string, moduleId: string): Promise<SystemResource | null> {
    return this.findOne({ where: { Slug: slug, ModuleId: moduleId } });
  }

  async findAllByModule(moduleId: string): Promise<SystemResource[]> {
    return this.findMany({ where: { ModuleId: moduleId, Active: true } });
  }
}
