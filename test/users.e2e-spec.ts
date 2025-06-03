import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { DataSource } from 'typeorm';
import { Roles } from 'src/modules/users/domain/models/users.models';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let tokenAdmin: string;
  let usuarioId: string;
  let dataSource: DataSource;
  let usersService: import('src/modules/users/domain/users.service').UsersService;
  const emailAdmin = `admin_${Date.now()}@exemplo.com`;
  const senhaAdmin = 'Admin@123';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    dataSource = app.get(DataSource);
    usersService = app.get(require('src/modules/users/domain/users.service').UsersService);

    // Limpa tabela de usuários
    await dataSource.query('DELETE FROM "Users"');

    // 1. Cria admin como usuário comum
    const admin = await usersService.create({
      Email: emailAdmin,
      Password: senhaAdmin,
      Name: 'Administrador',
      Role: Roles.ADMIN,
    });
    expect(admin.Role).toBe(Roles.ADMIN);

    // 3. Faz login para obter token já com role ADMIN
    const loginRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ Email: emailAdmin, Password: senhaAdmin });
    tokenAdmin = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (global.gc) global.gc();
  });

  describe('POST /users', () => {
    it('deve criar um novo usuário', async () => {
      const usuario = {
        Email: `usuario_${Date.now()}@exemplo.com`,
        Password: 'Usuario@123',
        Name: 'Usuário Teste',
        LastName: 'E2E',
      };
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `bearer ${tokenAdmin}`)
        .send(usuario)
        .expect(201);
      expect(res.body).toBeDefined();
      expect(res.body.data.Email).toBe(usuario.Email);
      expect(res.body.data.Name).toBe(usuario.Name);
      expect(res.body.data.Role).toBe('USER');
      usuarioId = res.body.data.Id;
    });
    it('não deve permitir email duplicado', async () => {
      const usuario = {
        Email: `duplicado_${Date.now()}@exemplo.com`,
        Password: 'Usuario@123',
        Name: 'Duplicado',
      };
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `bearer ${tokenAdmin}`)
        .send(usuario)
        .expect(201);
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `bearer ${tokenAdmin}`)
        .send(usuario)
        .expect(409);
    });
  });

  describe('GET /users', () => {
    it('deve listar usuários', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `bearer ${tokenAdmin}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /users/:id', () => {
    it('deve buscar usuário por id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${usuarioId}`)
        .set('Authorization', `bearer ${tokenAdmin}`)
        .expect(200);
      expect(res.body.data.Id).toBe(usuarioId);
    });
    it('deve retornar 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${tokenAdmin}`)
        .expect(404);
    });
  });

  describe('GET /users/email/:email', () => {
    it('deve buscar usuário por email', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/email/${encodeURIComponent(emailAdmin)}`)
        .set('Authorization', `bearer ${tokenAdmin}`)
        .expect(200);
      expect(res.body.data.Email).toBe(emailAdmin);
    });
  });

  describe('PATCH /users/:id', () => {
    it('deve atualizar usuário', async () => {
      const novoNome = 'Nome Atualizado';
      const res = await request(app.getHttpServer())
        .patch(`/users/${usuarioId}`)
        .set('Authorization', `bearer ${tokenAdmin}`)
        .send({ Name: novoNome })
        .expect(200);
      expect(res.body.data.Name).toBe(novoNome);
    });
  });

  describe('DELETE /users/:id', () => {
    it('deve remover usuário', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${usuarioId}`)
        .set('Authorization', `bearer ${tokenAdmin}`)
        .expect(204);
      await request(app.getHttpServer())
        .get(`/users/${usuarioId}`)
        .set('Authorization', `bearer ${tokenAdmin}`)
        .expect(404);
    });
  });

  describe('GET /users/inactive', () => {
    it('deve listar usuários inativos', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/inactive')
        .set('Authorization', `bearer ${tokenAdmin}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
