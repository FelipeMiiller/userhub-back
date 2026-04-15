import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantModule } from '../../../persistence/entities/tenantModules.entities';
import { TenantModuleRepository } from '../../../persistence/repository/tenant-module.typeorm.repository';
import { SystemModuleRepository } from '../../../persistence/repository/system-module.typeorm.repository';
import { TenantRepository } from '../../../persistence/repository/tenant.typeorm.repository';

@Injectable()
export class TenantModuleService {
  constructor(
    private readonly tenantModuleRepository: TenantModuleRepository,
    private readonly systemModuleRepository: SystemModuleRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async listModules(tenantId: string): Promise<TenantModule[]> {
    return this.tenantModuleRepository.findAllByTenant(tenantId);
  }

  async isModuleEnabled(tenantId: string, systemModuleId: string): Promise<boolean> {
    return this.tenantModuleRepository.isModuleActive(tenantId, systemModuleId);
  }

  async enableModule(tenantId: string, systemModuleId: string): Promise<TenantModule> {
    const [tenant, systemModule] = await Promise.all([
      this.tenantRepository.findOneById(tenantId),
      this.systemModuleRepository.findOneById(systemModuleId),
    ]);

    if (!tenant) throw new NotFoundException(`Tenant '${tenantId}' não encontrado`);
    if (!systemModule)
      throw new NotFoundException(`SystemModule '${systemModuleId}' não encontrado`);

    const existing = await this.tenantModuleRepository.findByTenantAndModule(
      tenantId,
      systemModuleId,
    );
    if (existing) {
      if (existing.Status === 'active') {
        throw new ConflictException('Módulo já está ativo para este tenant');
      }
      return this.tenantModuleRepository.update(existing.Id, {
        Status: 'active',
      }) as Promise<TenantModule>;
    }

    return this.tenantModuleRepository.create({
      TenantId: tenantId,
      SystemModuleId: systemModuleId,
      Status: 'active',
    });
  }

  async disableModule(tenantId: string, systemModuleId: string): Promise<void> {
    const existing = await this.tenantModuleRepository.findByTenantAndModule(
      tenantId,
      systemModuleId,
    );
    if (!existing) throw new NotFoundException('Módulo não está habilitado para este tenant');
    await this.tenantModuleRepository.update(existing.Id, { Status: 'inactive' });
  }
}
