import { INestApplication } from '@nestjs/common';
import { UsersService } from '../domain/users.service';
import { UserInput } from '../http/dtos/create-users.dto';
import { Roles, User } from '../domain/models/users.models';
import * as argon2 from 'argon2';
import { setupTestApp } from 'test/setup';
import { DataSource } from 'typeorm';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockReturnValue((mailoptions: any, callback: any) => {}),
  }),
}));

describe('UsersService', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: UsersService;

  let testUser: User;

  beforeAll(async () => {
    const testApp = await setupTestApp();
    app = testApp.app;
    dataSource = testApp.dataSource;
    service = app.get(UsersService);
    await dataSource.query('TRUNCATE TABLE "Users"');
    // Mock argon2.hash
    jest.spyOn(argon2, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));
  });

  afterAll(async () => {
    await dataSource.query('TRUNCATE TABLE "Users"');
    await app.close();
  });

  beforeEach(async () => {
    testUser = await service.create({
      Name: 'Test User',
      Email: `test-${Date.now()}@example.com`,
      Password: 'password123',
      Role: Roles.USER,
    });
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um usuário com papel padrão se não fornecido', async () => {
      const input: UserInput = {
        Name: 'New User',
        Email: `new-${Date.now()}@example.com`,
        Password: 'password123',
        Role: undefined,
      };

      const result = await service.create(input);

      expect(argon2.hash).toHaveBeenCalledWith(input.Password);
      expect(result).toBeDefined();
      expect(result.Name).toBe(input.Name);
      expect(result.Email).toBe(input.Email.toLowerCase());
      expect(result.Role).toBe(Roles.USER);
      expect(result.Password).not.toBe(input.Password);
    });

    it('deve criar um usuário com um papel especificado', async () => {
      const input: UserInput = {
        Name: 'Admin User',
        Email: `admin-${Date.now()}@example.com`,
        Password: 'admin123',
        Role: Roles.ADMIN,
      };

      const result = await service.create(input);

      expect(argon2.hash).toHaveBeenCalledWith(input.Password);
      expect(result).toBeDefined();
      expect(result.Role).toBe(Roles.ADMIN);
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário com sucesso', async () => {
      const updateData = {
        Name: 'Updated Name',
        Email: 'updated@example.com',
      };

      const result = await service.update(testUser.Id, updateData);

      expect(result).toBeDefined();
      expect(result.Id).toBe(testUser.Id);
      expect(result.Name).toBe(updateData.Name);
      expect(result.Email).toBe(updateData.Email.toLowerCase());
    });

    it('deve retornar nulo se o usuário a ser atualizado não for encontrado', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateData = { Name: 'Updated Name' };

      const result = await service.update(nonExistentId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    let testUsers: User[] = [];

    beforeEach(async () => {
      await dataSource.query('TRUNCATE TABLE "Users"');

      testUsers = await Promise.all([
        service.create({
          Name: 'User 1',
          Email: `user1-${Date.now()}@example.com`,
          Password: 'password123',
          Role: Roles.USER,
        }),
        service.create({
          Name: 'Admin User',
          Email: `admin-${Date.now()}@example.com`,
          Password: 'admin123',
          Role: Roles.ADMIN,
        }),
        service.create({
          Name: 'Aardvark User',
          Email: `aardvark-${Date.now()}@example.com`,
          Password: 'password123',
          Role: Roles.USER,
        }),
      ]);
    });

    it('deve retornar todos os usuários', async () => {
      const users = await service.findMany({});
      expect(users.length).toBe(3);
    });

    it('deve filtrar usuários por função', async () => {
      const adminUsers = await service.findMany({ role: Roles.ADMIN });
      expect(adminUsers.length).toBe(1);
      expect(adminUsers[0].Role).toBe(Roles.ADMIN);
    });

    it('deve ordenar usuários por nome', async () => {
      const users = await service.findMany({ sortBy: 'Name', order: 'asc' });

      const names = users.map((user) => user.Name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('findInactive', () => {
    it('deve encontrar usuários inativos nos últimos 30 dias (padrão)', async () => {
      const user = await service.create({
        Name: 'Inactive User',
        Email: `inactive-${Date.now()}@example.com`,
        Password: 'password123',
      });

      const inactiveDate = new Date();
      inactiveDate.setDate(inactiveDate.getDate() - 31);
      await service.update(user.Id, { LastLoginAt: inactiveDate });

      const result = await service.findInactive();

      const found = result.some((u) => u.Id === user.Id);
      expect(found).toBe(true);
    });

    it('deve encontrar usuários inativos para um número de dias especificado', async () => {
      const days = 60;

      const user = await service.create({
        Name: 'Very Inactive User',
        Email: `inactive-${Date.now()}@example.com`,
        Password: 'password123',
      });

      const inactiveDate = new Date();
      inactiveDate.setDate(inactiveDate.getDate() - (days + 1));
      await service.update(user.Id, { LastLoginAt: inactiveDate });

      const result = await service.findInactive(days);

      // Should find the inactive user
      const found = result.some((u) => u.Id === user.Id);
      expect(found).toBe(true);
    });
  });

  describe('findOneById', () => {
    it('deve encontrar um usuário por ID', async () => {
      const result = await service.findOneById(testUser.Id);

      expect(result).toBeDefined();
      expect(result?.Id).toBe(testUser.Id);
      expect(result?.Email).toBe(testUser.Email);
    });

    it('deve retornar nulo se o usuário não for encontrado por ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await service.findOneById(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe('findOneByEmail', () => {
    it('deve encontrar um usuário por Email', async () => {
      const result = await service.findOneByEmail(testUser.Email);

      expect(result).toBeDefined();
      expect(result?.Id).toBe(testUser.Id);
      expect(result?.Email).toBe(testUser.Email.toLowerCase());
    });

    it('deve retornar nulo se o usuário não for encontrado por Email', async () => {
      const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;
      const result = await service.findOneByEmail(nonExistentEmail);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deve deletar um usuário', async () => {
      const userToDelete = await service.create({
        Name: 'User to Delete',
        Email: `delete-${Date.now()}@example.com`,
        Password: 'password123',
      });

      await service.delete(userToDelete.Id);

      const deletedUser = await service.findOneById(userToDelete.Id);
      expect(deletedUser).toBeNull();
    });

    it('não deve lançar erro ao tentar deletar um usuário que não existe', async () => {
      await expect(service.delete('non-existent-id')).resolves.not.toThrow();
    });
  });
});
