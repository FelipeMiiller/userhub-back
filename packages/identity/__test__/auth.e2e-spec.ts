import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createNestApp } from 'test/setup';
import { DataSource } from 'typeorm';
import { IdentityModule } from 'packages/identity/identity.module';
import { ConfigModule } from '@nestjs/config';
import { pathEnv } from 'shared/lib/utils/pathEnv';
import appConfig from 'shared/config/app.config';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockReturnValue((mailoptions: any, callback: any) => {}),
  }),
}));

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  const testUserEmail = `test_user_${new Date().getTime()}@example.com`;
  const testUserPassword = 'Test@123';

  beforeAll(async () => {
    const testSetup = await createNestApp([
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig],
        envFilePath: pathEnv,
      }),
      IdentityModule,
    ]);
    app = testSetup.app;
    dataSource = testSetup.dataSource;

    await dataSource.query('TRUNCATE TABLE "Users"');
  });

  afterAll(async () => {
    await dataSource.query('TRUNCATE TABLE "Users"');
    await app.close();
  });

  describe('Registro de usuário', () => {
    it('/auth/signup (POST) - cria usuário com dados válidos', async () => {
      const timestamp = new Date().getTime();
      const userData = {
        Email: `e2euser_${timestamp}@example.com`,
        Password: 'Test@123',
        Name: 'E2E Test User',
      };

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('data');

      const userResponse = res.body.data;

      expect(userResponse).toHaveProperty('Email');

      // Verificar os valores

      expect(userResponse.Email).toBe(userData.Email.toLowerCase());
      expect(userResponse.Name).toBe(userData.Name.toLowerCase());
      expect(userResponse.Role).toBe('USER');
      expect(userResponse.Status).toBe(true);
      expect(userResponse.CreatedAt).toBeDefined();
      expect(userResponse.UpdatedAt).toBeDefined();
      expect(userResponse).not.toHaveProperty('Password');
      expect(userResponse).not.toHaveProperty('HashRefreshToken');
      expect(userResponse.LastLoginAt).toBeUndefined();
    });

    it('/auth/signup (POST) - não permite criar usuário com email já existente', async () => {
      const email = `duplicate_test_${Date.now()}@example.com`;
      const userData = {
        Email: email,
        Password: 'Password@123',
        Name: 'Original',
        LastName: 'User',
      };

      const firstResponse = await request(app.getHttpServer()).post('/auth/signup').send(userData);

      expect(firstResponse.status).toBe(201);
      expect(firstResponse.body).toHaveProperty('data.Email', email);

      const duplicateUserData = {
        Email: email,
        Password: 'DifferentPass@123',
        Name: 'Duplicate',
        LastName: 'User',
      };

      const secondResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(duplicateUserData);

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body).toHaveProperty('statusCode', 409);
      expect(secondResponse.body).toHaveProperty('message', 'Registro duplicado.');
    });

    it('/auth/signup (POST) - valida dados obrigatórios', async () => {
      const invalidUserData = {
        Email: 'invalid@example.com',
        Name: 'Invalid',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidUserData);

      expect(response.status).toBe(400);
    });

    it('/auth/signup (POST) - cria usuário normal com sucesso', async () => {
      const timestamp = new Date().getTime();
      const userData = {
        Email: `normal_user_${timestamp}@example.com`,
        Password: 'Normal@123',
        Name: 'Normal User',
      };

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('data');
      const userResponse = res.body.data;

      expect(userResponse).toHaveProperty('Email');
      expect(userResponse).toHaveProperty('Role');
      expect(userResponse.Role).toBe('USER');
    });
  });

  // Testes de login (signin)
  describe('Login de usuário', () => {
    it('/auth/signup (POST) - cria usuário para testes de autenticação', async () => {
      const userData = {
        Email: testUserEmail,
        Password: testUserPassword,
        Name: 'Test User',
        LastName: 'E2E',
      };

      const signupRes = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(signupRes.body).toHaveProperty('data');
      expect(signupRes.body.data).toHaveProperty('Email');
      expect(signupRes.body.data.Email).toBe(testUserEmail);
      expect(signupRes.body.data).not.toHaveProperty('Password');
      expect(signupRes.body.data).not.toHaveProperty('HashRefreshToken');
      expect(signupRes.body.data.LastLoginAt).toBeUndefined();

      userId = signupRes.body.data.Id;
      expect(userId).toBeDefined();
    });

    it('/auth/signin (POST) - login com credenciais válidas', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          Email: testUserEmail,
          Password: testUserPassword,
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('data');
      expect(loginRes.body.data).toHaveProperty('accessToken');
      expect(loginRes.body.data).toHaveProperty('refreshToken');

      accessToken = loginRes.body.data.accessToken;
      refreshToken = loginRes.body.data.refreshToken;

      expect(typeof accessToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(10);
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.length).toBeGreaterThan(10);
    });

    it('/auth/signin (POST) - falha com credenciais inválidas', async () => {
      const email = 'login_invalid_test@example.com';
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          Email: email,
          Password: 'CorrectPassword@123',
          Name: 'Login',
          LastName: 'Test',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          Email: email,
          Password: 'WrongPassword',
        })
        .expect(401);

      const errorResponse = res.body;
      expect(errorResponse).toHaveProperty('message');
      expect(errorResponse.message).toMatch('Credenciais inválidas');
    });
  });

  describe('Refresh token', () => {
    it('/auth/refresh (POST) - renova token de acesso', async () => {
      const email = 'login_invalid_test@example.com';
      const loginRes = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          Email: email,
          Password: 'CorrectPassword@123',
        })
        .expect(200);

      expect(loginRes.body.data.refreshToken).toBeDefined();
      expect(loginRes.body.data.refreshToken.length).toBeGreaterThan(10);

      const res = await request(app.getHttpServer())
        .post('/auth/refreshToken')
        .send({ refreshToken: loginRes.body.data.refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.accessToken.length).toBeGreaterThan(10);
      expect(typeof res.body.data.refreshToken).toBe('string');
      expect(res.body.data.refreshToken.length).toBeGreaterThan(10);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('/auth/refresh (POST) - falha com token inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/refreshToken')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('Perfil do usuário', () => {
    let profileAccessToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ Email: testUserEmail, Password: testUserPassword })
        .expect(200);

      expect(loginRes.body.data).toHaveProperty('accessToken');
      profileAccessToken = loginRes.body.data.accessToken;
      expect(profileAccessToken).toBeDefined();
      expect(profileAccessToken.length).toBeGreaterThan(10);
    });

    it('/auth/me (GET) - obtém perfil do usuário logado', async () => {
      expect(profileAccessToken).toBeDefined();

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `bearer ${profileAccessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');

      const userData = res.body.data;

      expect(userData).toHaveProperty('Email');
      expect(userData).toHaveProperty('Name');
      expect(userData).toHaveProperty('Id');
      expect(userData).toHaveProperty('Role');
      expect(userData).toHaveProperty('Status');
      expect(userData).toHaveProperty('CreatedAt');
      expect(userData).toHaveProperty('UpdatedAt');
      expect(userData).not.toHaveProperty('Password');
      expect(userData).not.toHaveProperty('HashRefreshToken');

      expect(userData.Email).toBe(testUserEmail);
    });

    it('/auth/me (GET) - falha sem autenticação', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('Logout de usuário', () => {
    it('/auth/signout (POST) - realiza logout do usuário', async () => {
      expect(accessToken).toBeDefined();
      expect(accessToken.length).toBeGreaterThan(10);

      await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Authorization', `bearer ${accessToken}`)
        .expect(200);

      expect(refreshToken).toBeDefined();

      await request(app.getHttpServer())
        .post('/auth/refreshToken')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
