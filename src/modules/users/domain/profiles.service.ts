import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProfileEntity } from '../domain/entities/profile.entities';
import { UpdateProfileDto } from '../http/dtos/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async findByIdUser(Id: string) {
    const profile = await this.profileRepository.findOne({ where: { User: { Id } } });
    return profile;
  }

  async findById(Id: string) {
    const profile = await this.profileRepository.findOne({ where: { Id } });
    return profile;
  }

  async update(Id: string, dto: UpdateProfileDto) {
    const profile = await this.profileRepository.findOneBy({ Id });
    if (!profile) throw new NotFoundException('Profile not found');
    Object.assign(profile, dto);
    return this.profileRepository.save(profile);
  }

  async remove(Id: string) {
    const profile = await this.profileRepository.findOneBy({ Id });
    if (!profile) throw new NotFoundException('Profile not found');
    await this.profileRepository.remove(profile);
  }
}
