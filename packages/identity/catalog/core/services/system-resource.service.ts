import { Injectable } from '@nestjs/common';
import { SystemResource } from '../../../persistence/entities/resources.entities';
import { SystemResourceRepository } from '../../../persistence/repository/system-resource.typeorm.repository';

@Injectable()
export class SystemResourceService {
  constructor(private readonly systemResourceRepository: SystemResourceRepository) {}

  async findAllByModule(moduleId: string): Promise<SystemResource[]> {
    return this.systemResourceRepository.findAllByModule(moduleId);
  }

  async findOneById(id: string): Promise<SystemResource | null> {
    return this.systemResourceRepository.findOneById(id);
  }
}
