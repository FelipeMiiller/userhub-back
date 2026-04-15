import { Injectable } from '@nestjs/common';
import { SystemModule } from '../../../persistence/entities/modules.entities';
import { SystemModuleRepository } from '../../../persistence/repository/system-module.typeorm.repository';

@Injectable()
export class SystemModuleService {
  constructor(private readonly systemModuleRepository: SystemModuleRepository) {}

  async findAll(): Promise<SystemModule[]> {
    return this.systemModuleRepository.findMany({});
  }

  async findOneById(id: string): Promise<SystemModule | null> {
    return this.systemModuleRepository.findOneById(id);
  }

  async findBySlug(slug: string): Promise<SystemModule | null> {
    return this.systemModuleRepository.findBySlug(slug);
  }
}
