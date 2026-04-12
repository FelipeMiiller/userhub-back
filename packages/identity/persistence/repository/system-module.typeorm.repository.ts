import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { SystemModule } from '../entities/modules.entities';

@Injectable()
export class SystemModuleRepository extends DefaultTypeOrmRepository<SystemModule> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(SystemModule, dataSource.manager);
  }

  async findBySlug(slug: string): Promise<SystemModule | null> {
    return this.findOne({ where: { Slug: slug } });
  }

  async findAllActive(): Promise<SystemModule[]> {
    return this.findMany({ where: { Active: true } });
  }
}
