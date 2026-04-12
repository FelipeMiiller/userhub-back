import { AccountRepository, CreateAccountWithProfileInput, AccountMeProjection } from '../../../persistence/repository/account.typeorm.repository';
import { LoggerService } from '@hub/shared-module/loggers';
import { Account } from '../../../persistence/entities/accounts.entities';
import { Profile } from '../../../persistence/entities/profiles.entities';
import { ProfileRepository } from '../../../persistence/repository/profile.typeorm.repository';
import { UpdateMeRequestDto } from '../../http/dto/request/update-me.dto';
import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { AccountTenantService, CreateTenantWithOwnerInput, TenantWithMembership } from '../../../tenant/core/services/account-tenant.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,

    private readonly profileRepository: ProfileRepository,
    private readonly accountTenantService: AccountTenantService,
    private readonly loggerService: LoggerService,

  ) {
    this.loggerService.contextName = AccountService.name;
  }

  async create(data: {
    Email: string;
    Password: string;
    Provider?: string;
  }): Promise<Account> {
    const account = await this.accountRepository.create({
      Email: data.Email,
      Password: await argon2.hash(data.Password),
      Provider: data.Provider ?? 'local',
      HashRefreshToken: null,
      EmailVerified: false,
      Status: true,
    });

    this.loggerService.info(`Account criada: ${account.Email}`);
    return account;
  }

  /** Cria account + profile em transação. Recebe senha em texto plano e faz o hash internamente. */
  async createWithProfile(data: CreateAccountWithProfileInput): Promise<Account> {
    const account = await this.accountRepository.createWithProfile({
      ...data,
      Password: await argon2.hash(data.Password),
    });
    this.loggerService.info(`Account+Profile criados: ${account.Email}`);
    return account;
  }

  async findMe(id: string): Promise<AccountMeProjection | null> {
    return this.accountRepository.findMeById(id);
  }

  async updateMe(id: string, dto: UpdateMeRequestDto): Promise<boolean | null> {
    await this.profileRepository.updateByAccountId(id, dto);
    return true;
  }

  async updateEmailVerified(id: string): Promise<void> {
    await this.accountRepository.update(id, { EmailVerified: true });
  }
  async updateProfile(id: string, dto: Partial<Profile>): Promise<boolean> {
    await this.profileRepository.update(id, dto);
    return true;
  }
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await argon2.hash(newPassword);
    await this.accountRepository.resetPassword(id, hashedPassword);
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    if (refreshToken) {
      const hashed = await argon2.hash(refreshToken);
      await this.accountRepository.updateRefreshToken(id, hashed);
      return;
    }
    await this.accountRepository.updateRefreshToken(id, null);
  }

  async findOneById(id: string): Promise<Account | null> {
    return this.accountRepository.findOneById(id);
  }

  async findOneByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOneByEmail(email);
  }

  /** Redefine a senha (texto plano) e invalida o refresh token. */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const hashed = await argon2.hash(newPassword);
    await this.accountRepository.resetPassword(id, hashed);
  }


  // ─── profile ──────────────────────────────────────────────────────────────
  async findProfileByAccountId(accountId: string): Promise<Profile | null> {
    return this.profileRepository.findOneByAccountId(accountId);
  }


  // ─── account-tenant ───────────────────────────────────────────────────────
  async createOnboardingTenant(input: CreateTenantWithOwnerInput): Promise<TenantWithMembership> {
    return this.accountTenantService.createTenantWithOwner(input);
  }
}




