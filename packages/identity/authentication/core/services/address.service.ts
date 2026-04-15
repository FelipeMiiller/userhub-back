import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AddressRepository } from '../../../persistence/repository/address.typeorm.repository';
import { ProfileRepository } from '../../../persistence/repository/profile.typeorm.repository';
import { Address } from '../../../persistence/entities/addresses.entities';

export interface CreateAddressInput {
  Type?: Address['Type'];
  Street: string;
  Number?: string | null;
  Complement?: string | null;
  Neighborhood?: string | null;
  City: string;
  State: string;
  Country?: string;
  ZipCode?: string | null;
  Formatted?: string | null;
  Latitude?: number | null;
  Longitude?: number | null;
}

@Injectable()
export class AddressService {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  private async resolveProfileId(accountId: string): Promise<string> {
    const profile = await this.profileRepository.findOneByAccountId(accountId);
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    return profile.Id;
  }

  async findAllByAccount(accountId: string): Promise<Address[]> {
    const profileId = await this.resolveProfileId(accountId);
    return this.addressRepository.findAllByProfile(profileId);
  }

  async findByIdForAccount(id: string, accountId: string): Promise<Address> {
    const profileId = await this.resolveProfileId(accountId);
    const address = await this.addressRepository.findByIdAndProfile(id, profileId);
    if (!address) throw new NotFoundException('Endereço não encontrado.');
    return address;
  }

  async createForAccount(accountId: string, data: CreateAddressInput): Promise<Address> {
    const profileId = await this.resolveProfileId(accountId);
    return this.addressRepository.create({ ...data, ProfileId: profileId });
  }

  async updateForAccount(
    id: string,
    accountId: string,
    data: Partial<CreateAddressInput>,
  ): Promise<Address> {
    const profileId = await this.resolveProfileId(accountId);
    const existing = await this.addressRepository.findByIdAndProfile(id, profileId);
    if (!existing) throw new NotFoundException('Endereço não encontrado.');
    const updated = await this.addressRepository.update(id, data as Partial<Address>);
    if (!updated) throw new NotFoundException('Endereço não encontrado.');
    return updated;
  }

  async deleteForAccount(id: string, accountId: string): Promise<void> {
    const profileId = await this.resolveProfileId(accountId);
    const existing = await this.addressRepository.findByIdAndProfile(id, profileId);
    if (!existing) throw new NotFoundException('Endereço não encontrado.');
    await this.addressRepository.delete(id);
  }

  // ── Tenant-scoped: admin manages any account's addresses within a tenant ──

  async findAllByAccountInTenant(targetAccountId: string): Promise<Address[]> {
    const profile = await this.profileRepository.findOneByAccountId(targetAccountId);
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    return this.addressRepository.findAllByProfile(profile.Id);
  }

  async findByIdForAccountInTenant(id: string, targetAccountId: string): Promise<Address> {
    const profile = await this.profileRepository.findOneByAccountId(targetAccountId);
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    const address = await this.addressRepository.findByIdAndProfile(id, profile.Id);
    if (!address) throw new NotFoundException('Endereço não encontrado.');
    return address;
  }

  async createForAccountInTenant(
    targetAccountId: string,
    data: CreateAddressInput,
  ): Promise<Address> {
    const profile = await this.profileRepository.findOneByAccountId(targetAccountId);
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    return this.addressRepository.create({ ...data, ProfileId: profile.Id });
  }

  async updateForAccountInTenant(
    id: string,
    targetAccountId: string,
    data: Partial<CreateAddressInput>,
  ): Promise<Address> {
    const profile = await this.profileRepository.findOneByAccountId(targetAccountId);
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    const existing = await this.addressRepository.findByIdAndProfile(id, profile.Id);
    if (!existing) throw new NotFoundException('Endereço não encontrado.');
    const updated = await this.addressRepository.update(id, data as Partial<Address>);
    if (!updated) throw new NotFoundException('Endereço não encontrado.');
    return updated;
  }

  async deleteForAccountInTenant(id: string, targetAccountId: string): Promise<void> {
    const profile = await this.profileRepository.findOneByAccountId(targetAccountId);
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    const existing = await this.addressRepository.findByIdAndProfile(id, profile.Id);
    if (!existing) throw new NotFoundException('Endereço não encontrado.');
    await this.addressRepository.delete(id);
  }
}
