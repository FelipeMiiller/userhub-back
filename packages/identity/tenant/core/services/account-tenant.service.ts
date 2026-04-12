import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountTenant, AccountTenantStatus } from '../../../persistence/entities/accountTenants.entities';
import {
  AccountTenantRepository,
  CreateTenantWithOwnerInput,
  TenantWithMembership,
} from '../../../persistence/repository/account-tenant.typeorm.repository';
import { AccountRepository } from '../../../persistence/repository/account.typeorm.repository';
import { TenantRepository } from '../../../persistence/repository/tenant.typeorm.repository';

export { CreateTenantWithOwnerInput, TenantWithMembership } from '../../../persistence/repository/account-tenant.typeorm.repository';

export interface AddMemberInput {
  AccountId: string;
  TenantId: string;
  TenantRoleId?: string;
  Status?: AccountTenantStatus;
}

@Injectable()
export class AccountTenantService {
  constructor(
    private readonly accountTenantRepository: AccountTenantRepository,
    private readonly accountRepository: AccountRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async findMembership(accountId: string, tenantId: string): Promise<AccountTenant | null> {
    return this.accountTenantRepository.findOneByAccountAndTenant(accountId, tenantId);
  }

  async findAllByAccount(accountId: string): Promise<AccountTenant[]> {
    return this.accountTenantRepository.findAllByAccount(accountId);
  }

  async findAllByTenant(tenantId: string): Promise<AccountTenant[]> {
    return this.accountTenantRepository.findAllByTenant(tenantId);
  }

  async create(data: Partial<AccountTenant>): Promise<AccountTenant> {
    return this.accountTenantRepository.create(data);
  }

  async addMember(input: AddMemberInput): Promise<AccountTenant> {
    const [account, tenant] = await Promise.all([
      this.accountRepository.findOneById(input.AccountId),
      this.tenantRepository.findOneById(input.TenantId),
    ]);

    if (!account) throw new NotFoundException(`Account '${input.AccountId}' não encontrada`);
    if (!tenant) throw new NotFoundException(`Tenant '${input.TenantId}' não encontrado`);

    const existing = await this.accountTenantRepository.findOneByAccountAndTenant(
      input.AccountId,
      input.TenantId,
    );
    if (existing) throw new ConflictException('Account já é membro deste tenant');

    return this.accountTenantRepository.create({
      AccountId: input.AccountId,
      TenantId: input.TenantId,
      TenantRoleId: input.TenantRoleId ?? null,
      Status: input.Status ?? 'active',
    });
  }

  async update(id: string, data: Partial<AccountTenant>): Promise<AccountTenant | null> {
    return this.accountTenantRepository.update(id, data);
  }

  async createTenantWithOwner(input: CreateTenantWithOwnerInput): Promise<TenantWithMembership> {
    const account = await this.accountRepository.findOneById(input.AccountId);
    if (!account) throw new NotFoundException(`Account '${input.AccountId}' não encontrada`);

    const slugTaken = await this.tenantRepository.findOneBySlug(input.Slug);
    if (slugTaken) throw new ConflictException(`Slug '${input.Slug}' já está em uso`);

    return this.accountTenantRepository.createTenantWithOwner(input);
  }

  async remove(id: string): Promise<void> {
    return this.accountTenantRepository.delete(id);
  }
}
