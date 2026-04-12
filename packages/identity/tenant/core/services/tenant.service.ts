import { Injectable } from '@nestjs/common';
import { Tenant } from '../../../persistence/entities/tenants.entities';
import { TenantRepository } from '../../../persistence/repository/tenant.typeorm.repository';


@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async findOneById(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOneById(id);
  }

  async findOneBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOneBySlug(slug);
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    return this.tenantRepository.create(data);
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant | null> {
    return this.tenantRepository.update(id, data);
  }



}
