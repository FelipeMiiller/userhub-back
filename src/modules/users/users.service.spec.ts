import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './domain/users.service';
import {
  USERS_REPOSITORY_TOKEN,
  UsersRepository,
} from './domain/repositories/users.repository.interface';
import { LoggerService } from 'src/common/loggers/domain/logger.service';
import { UserInput } from './http/dtos/create-users.dto';
import { Roles, User } from './domain/models/users.models';
import * as argon2 from 'argon2';
import { UserCreatedEvent } from 'src/common/events/user-created.event';

// Mock argon2
jest.mock('argon2');

const mockUsersRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findMany: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};

const mockLoggerService = {
  contextName: '',
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockUser: User = {
  Id: '1',
  Name: 'Test User',
  Email: 'test@example.com',
  Password: 'hashedPassword',
  Role: Roles.USER,
  CreatedAt: new Date(),
  UpdatedAt: new Date(),
  LastLoginAt: undefined,
  HashRefreshToken: null,

  LastName: null,
  AvatarUrl: null,
  Status: true,
};

const mockUserInput: UserInput = {
  Name: 'Test User',
  Email: 'test@example.com',
  Password: 'password123',
  Role: Roles.USER,
};

describe('UsersService', () => {
  let service: UsersService;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USERS_REPOSITORY_TOKEN,
          useValue: mockUsersRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    // Reset mocks before each test
    jest.clearAllMocks();
    (argon2.hash as jest.Mock).mockResolvedValue('hashedPassword');
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um usuário com papel padrão se não fornecido', async () => {
      const input: UserInput = { ...mockUserInput, Role: undefined };
      mockUsersRepository.create.mockResolvedValueOnce(mockUser);

      const result = await service.create(input);

      expect(argon2.hash).toHaveBeenCalledWith(input.Password);
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        Name: input.Name,
        Email: input.Email,
        Password: 'hashedPassword',
        Role: Roles.USER, // Default role
        HashRefreshToken: null,
      });
      expect(result).toEqual(mockUser);
      expect(result.Email).toEqual(input.Email);
    });

    it('deve criar um usuário com um papel especificado', async () => {
      const input: UserInput = { ...mockUserInput, Role: Roles.ADMIN };
      const userWithAdminRole = { ...mockUser, Role: Roles.ADMIN };
      mockUsersRepository.create.mockResolvedValueOnce(userWithAdminRole);

      const result = await service.create(input);

      expect(argon2.hash).toHaveBeenCalledWith(input.Password);
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        Name: input.Name,
        Email: input.Email,
        Password: 'hashedPassword',
        Role: Roles.ADMIN,
        HashRefreshToken: null,
      });
      expect(result).toEqual(userWithAdminRole);
      expect(result.Role).toEqual(Roles.ADMIN);
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário com sucesso', async () => {
      const userId = '1';
      const updateData = { Name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateData };
      mockUsersRepository.update.mockResolvedValueOnce(updatedUser);

      const result = await service.update(userId, updateData);

      expect(mockUsersRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(result).toEqual(updatedUser);
    });

    it('deve retornar nulo se o usuário a ser atualizado não for encontrado', async () => {
      const userId = 'non-existent-id';
      const updateData = { Name: 'Updated Name' };
      mockUsersRepository.update.mockResolvedValueOnce(null);

      const result = await service.update(userId, updateData);

      expect(mockUsersRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('deve encontrar usuários com opções padrão', async () => {
      mockUsersRepository.findMany.mockResolvedValueOnce([mockUser]);
      const result = await service.findMany({});
      expect(mockUsersRepository.findMany).toHaveBeenCalledWith({
        where: undefined,
        order: { undefined: undefined }, // Reflects current implementation if sortBy/order are undefined
      });
      expect(result).toEqual([mockUser]);
    });

    it('deve encontrar usuários com filtro de papel', async () => {
      mockUsersRepository.findMany.mockResolvedValueOnce([mockUser]);
      await service.findMany({ role: Roles.ADMIN });
      expect(mockUsersRepository.findMany).toHaveBeenCalledWith({
        where: { Role: Roles.ADMIN },
        order: { undefined: undefined },
      });
    });

    it('deve encontrar usuários com opções de ordenação e direção', async () => {
      mockUsersRepository.findMany.mockResolvedValueOnce([mockUser]);
      await service.findMany({ sortBy: 'CreatedAt', order: 'desc' });
      expect(mockUsersRepository.findMany).toHaveBeenCalledWith({
        where: undefined,
        order: { CreatedAt: 'desc' },
      });
    });
  });

  describe('findInactive', () => {
    it('deve encontrar usuários inativos nos últimos 30 dias (padrão)', async () => {
      const inactiveUser = {
        ...mockUser,
        LastLoginAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      };
      mockUsersRepository.findMany.mockResolvedValueOnce([inactiveUser]);

      const result = await service.findInactive();

      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 30);

      expect(mockUsersRepository.findMany).toHaveBeenCalledWith({
        where: [{ LastLoginAt: null }, { LastLoginAt: expect.anything() }], 
        order: { LastLoginAt: 'ASC' },
      });
   
      const callArg = mockUsersRepository.findMany.mock.calls[0][0];
      expect(callArg.where[1].LastLoginAt.value.getTime()).toBeLessThanOrEqual(sinceDate.getTime());
      expect(result).toEqual([inactiveUser]);
    });

    it('deve encontrar usuários inativos para um número de dias especificado', async () => {
      const days = 60;
      const inactiveUser = {
        ...mockUser,
        LastLoginAt: new Date(Date.now() - (days + 1) * 24 * 60 * 60 * 1000),
      };
      mockUsersRepository.findMany.mockResolvedValueOnce([inactiveUser]);

      const result = await service.findInactive(days);

      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      expect(mockUsersRepository.findMany).toHaveBeenCalledWith({
        where: [{ LastLoginAt: null }, { LastLoginAt: expect.anything() }],
        order: { LastLoginAt: 'ASC' },
      });
      const callArg = mockUsersRepository.findMany.mock.calls[0][0];
      expect(callArg.where[1].LastLoginAt.value.getTime()).toBeLessThanOrEqual(sinceDate.getTime());
      expect(result).toEqual([inactiveUser]);
    });
  });

  describe('findOneById', () => {
    it('deve encontrar um usuário por ID', async () => {
      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
      const result = await service.findOneById('1');
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({ where: { Id: '1' } });
      expect(result).toBeInstanceOf(User);
      expect(result?.Id).toBe('1');
    });

    it('deve retornar nulo se o usuário não for encontrado por ID', async () => {
      mockUsersRepository.findOne.mockResolvedValueOnce(null);
      const result = await service.findOneById('non-existent-id');
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { Id: 'non-existent-id' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findOneByEmail', () => {
    it('deve encontrar um usuário por Email', async () => {
      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
      const result = await service.findOneByEmail('test@example.com');
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { Email: 'test@example.com' },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.Email).toBe('test@example.com');
    });

    it('deve retornar nulo se o usuário não for encontrado por Email', async () => {
      mockUsersRepository.findOne.mockResolvedValueOnce(null);
      const result = await service.findOneByEmail('non-existent@example.com');
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { Email: 'non-existent@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deve deletar um usuário', async () => {
      mockUsersRepository.delete.mockResolvedValueOnce(undefined);
      await service.delete('1');
      expect(mockUsersRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
