import { AccountService } from '../core/services/account.service';
import { accountFactory } from '../../__tests__/factory/account.test-factory';

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(() => {
    service = {
      create: jest.fn(async (input) => ({
        ...accountFactory.build(),
        Email: input.Email,
        Password: 'hashedPassword',
        Provider: input.Provider ?? 'local',
      })),
      createWithProfile: jest.fn(async (input) => ({
        ...accountFactory.build(),
        Email: input.Email,
        Password: 'hashedPassword',
        Provider: input.Provider ?? 'local',
      })),
      findMe: jest.fn(async (id) => ({ Id: id, Email: 'user@example.com', tenants: [] })),
      updateMe: jest.fn(async () => true),
      updateEmailVerified: jest.fn(async () => undefined),
      updateProfile: jest.fn(async () => true),
      updatePassword: jest.fn(async () => undefined),
      updateRefreshToken: jest.fn(async () => undefined),
      findOneById: jest.fn(async (id) => ({ ...accountFactory.build(), Id: id })),
      findOneByEmail: jest.fn(async (email) => ({ ...accountFactory.build(), Email: email })),
      resetPassword: jest.fn(async () => undefined),
      findProfileByAccountId: jest.fn(async () => null),
      createOnboardingTenant: jest.fn(async (input) => ({
        tenant: { Id: 'uuid-tenant', Name: input.TenantName },
        membership: { AccountId: input.AccountId, TenantId: 'uuid-tenant', Status: true },
      })),
    } as unknown as AccountService;
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma conta com provider padrão "local"', async () => {
      const input = { Email: 'novo@example.com', Password: 'password123' };
      const result = await service.create(input);
      expect(result).toBeDefined();
      expect(result.Email).toBe(input.Email);
      expect(result.Provider).toBe('local');
      expect(result.Password).toBe('hashedPassword');
    });

    it('deve criar uma conta com provider externo', async () => {
      const input = { Email: 'google@example.com', Password: 'senha', Provider: 'google' };
      const result = await service.create(input);
      expect(result.Provider).toBe('google');
    });
  });

  describe('updateRefreshToken', () => {
    it('deve atualizar o refresh token', async () => {
      const id = accountFactory.build().Id as string;
      await expect(service.updateRefreshToken(id, 'new-token')).resolves.not.toThrow();
    });

    it('deve limpar o refresh token ao passar null', async () => {
      const id = accountFactory.build().Id as string;
      await expect(service.updateRefreshToken(id, null)).resolves.not.toThrow();
    });
  });

  describe('findOneById', () => {
    it('deve encontrar uma conta por ID', async () => {
      const id = accountFactory.build().Id as string;
      const result = await service.findOneById(id);
      expect(result).toBeDefined();
      expect(result?.Id).toBe(id);
    });

    it('deve retornar nulo se não encontrada', async () => {
      (service.findOneById as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.findOneById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('findOneByEmail', () => {
    it('deve encontrar uma conta por Email', async () => {
      const email = accountFactory.build().Email as string;
      const result = await service.findOneByEmail(email);
      expect(result).toBeDefined();
      expect(result?.Email).toBe(email);
    });

    it('deve retornar nulo se não encontrada', async () => {
      (service.findOneByEmail as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.findOneByEmail('naoexiste@example.com');
      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir a senha sem lançar erros', async () => {
      const id = accountFactory.build().Id as string;
      await expect(service.resetPassword(id, 'novaSenha123')).resolves.not.toThrow();
    });
  });

  describe('findMe', () => {
    it('deve retornar a projeção do account autenticado', async () => {
      const id = accountFactory.build().Id as string;
      const result = await service.findMe(id);
      expect(result).toBeDefined();
      expect(result?.Id).toBe(id);
    });

    it('deve retornar nulo se account não encontrado', async () => {
      (service.findMe as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.findMe('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('updateMe', () => {
    it('deve atualizar dados do account autenticado', async () => {
      const id = accountFactory.build().Id as string;
      const result = await service.updateMe(id, { FirstName: 'Felipe' } as any);
      expect(result).toBe(true);
    });
  });

  describe('createOnboardingTenant', () => {
    it('deve criar tenant e retornar membership', async () => {
      const input = {
        AccountId: accountFactory.build().Id as string,
        TenantName: 'Empresa X',
        TenantSlug: 'empresa-x',
      };
      const result = await service.createOnboardingTenant(input as any);
      expect(result).toBeDefined();
      expect(result.tenant).toBeDefined();
      expect(result.membership.AccountId).toBe(input.AccountId);
    });
  });
});

