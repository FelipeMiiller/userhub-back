import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DefaultTypeOrmRepository } from '@hub/shared-module/persistences';
import { TenantModule } from '../entities/tenantModules.entities';

@Injectable()
export class TenantModuleRepository extends DefaultTypeOrmRepository<TenantModule> {
  constructor(
    @InjectDataSource('identity')
    dataSource: DataSource,
  ) {
    super(TenantModule, dataSource.manager);
  }

  async findAllByTenant(tenantId: string): Promise<TenantModule[]> {
    return this.findMany({ where: { TenantId: tenantId } });
  }

  async findAllActiveByTenant(tenantId: string): Promise<TenantModule[]> {
    return this.findMany({ where: { TenantId: tenantId, Status: 'active' } });
  }

  async findByTenantAndModule(
    tenantId: string,
    systemModuleId: string,
  ): Promise<TenantModule | null> {
    return this.findOne({ where: { TenantId: tenantId, SystemModuleId: systemModuleId } });
  }

  async isModuleActive(tenantId: string, systemModuleId: string): Promise<boolean> {
    const row = await this.findOne({
      where: { TenantId: tenantId, SystemModuleId: systemModuleId, Status: 'active' },
    });
    return row !== null;
  }
}
