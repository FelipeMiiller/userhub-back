import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Roles } from 'src/modules/users/domain/models/users.models';
import { setupTestApp, teardownTestApp } from './test-utils';
import { UsersService } from 'src/modules/users/domain/users.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let tokenAdmin: string;

  let usuarioId: string;
  let service: UsersService;

  const emailAdmin = `adminE2E_${Date.now()}@exemplo.com`;
  const senhaAdmin = 'AdminE2E@123';

  beforeAll(async () => {
    const testSetup = await setupTestApp();
    app = testSetup.app;
    service = app.get(UsersService);


    const res = await service.create({ Email: emailAdmin,
        Password: senhaAdmin,
        Name: 'Administrador',
        Role: Roles.ADMIN,});
  
    expect(res.Role).toBe(Roles.ADMIN);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ Email: emailAdmin, Password: senhaAdmin });
    console.log('loginRes.body', loginRes.body);

    tokenAdmin = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await teardownTestApp(app);
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
      expect(res.body.data.Email).toBe(usuario.Email.toLowerCase());
      expect(res.body.data.Name).toBe(usuario.Name.toLowerCase());
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
      const userToDeleteEmail = `delete_me_${Date.now()}@exemplo.com`;
      const userToDeletePassword = 'PasswordToDelete123!';
      const createUserRes = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `bearer ${tokenAdmin}`)
        .send({
          Email: userToDeleteEmail,
          Password: userToDeletePassword,
          Name: 'User',
          LastName: 'ToDelete',
          Role: Roles.USER, // Explicitly set role if needed, or let backend default
        })
        .expect(201);

      const userIdToDelete = createUserRes.body.data.Id;
      expect(userIdToDelete).toBeDefined();

      await request(app.getHttpServer())
        .delete(`/users/${userIdToDelete}`)
        .set('Authorization', `bearer ${tokenAdmin}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/users/${userIdToDelete}`)
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
