import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createIdentityApp } from '../../../__tests__/e2e/setup';
import { accountFactory } from '../../../__tests__/factory/account.test-factory';
import { profileFactory } from '../../../__tests__/factory/profile.test-factory';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  const testUserEmail = accountFactory.build().Email as string;
  const testUserPassword = 'Test@123';

  beforeAll(async () => {
    const testSetup = await createIdentityApp();
    app = testSetup.app;
    dataSource = testSetup.dataSource;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Registro de conta', () => {
    it('/auth/signup (POST) - cria conta com dados válidos', async () => {
      const account = accountFactory.build();
      const profile = profileFactory.build();
      const userData = {
        Email: account.Email,
        Password: 'Test@123',
        FirstName: profile.FirstName,
        LastName: profile.LastName,
      };

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('data');

      const userResponse = res.body.data;
      expect(userResponse).toHaveProperty('Email');
      expect(userResponse.Email).toBe(userData.Email?.toLowerCase());
      expect(userResponse.Status).toBe(true);
      expect(userResponse.CreatedAt).toBeDefined();
      expect(userResponse.UpdatedAt).toBeDefined();
      expect(userResponse).not.toHaveProperty('Password');
      expect(userResponse).not.toHaveProperty('HashRefreshToken');
    });

    it('/auth/signup (POST) - não permite criar conta com email já existente', async () => {
      const account = accountFactory.build();
      const profile = profileFactory.build();
      const userData = {
        Email: account.Email,
        Password: 'Password@123',
        FirstName: profile.FirstName,
        LastName: profile.LastName,
      };

      await request(app.getHttpServer()).post('/auth/signup').send(userData).expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ ...userData, Password: 'DifferentPass@123', FirstName: profileFactory.build().FirstName });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message', 'E-mail já cadastrado');
    });

    it('/auth/signup (POST) - valida dados obrigatórios de conta', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ Email: 'invalid@example.com', FirstName: 'Invalid' });

      expect(res.status).toBe(400);
    });

    it('/auth/signup (POST) - cria conta normal com sucesso', async () => {
      const account = accountFactory.build();
      const profile = profileFactory.build();
      const userData = {
        Email: account.Email,
        Password: 'Normal@123',
        FirstName: profile.FirstName,
        LastName: profile.LastName,
      };

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('data.Email');
    });
  });

  describe('Login de conta', () => {
    beforeAll(async () => {
      const profile = profileFactory.build();
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          Email: testUserEmail,
          Password: testUserPassword,
          FirstName: profile.FirstName,
          LastName: profile.LastName,
        })
        .expect(201);
    });

    it('/auth/signin (POST) - login com credenciais válidas', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ Email: testUserEmail, Password: testUserPassword })
        .expect(200);

      expect(loginRes.body.data).toHaveProperty('accessToken');
      expect(loginRes.body.data).toHaveProperty('refreshToken');

      accessToken = loginRes.body.data.accessToken;
      refreshToken = loginRes.body.data.refreshToken;

      expect(typeof accessToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(10);
    });

    it('/auth/signin (POST) - falha com credenciais inválidas', async () => {
      const account = accountFactory.build();
      const profile = profileFactory.build();
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          Email: account.Email,
          Password: 'CorrectPassword@123',
          FirstName: profile.FirstName,
          LastName: profile.LastName,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ Email: account.Email, Password: 'WrongPassword' })
        .expect(401);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch('Credenciais inválidas');
    });
  });

  describe('Refresh token', () => {
    it('/auth/refreshToken (POST) - renova token de acesso', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refreshToken')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(typeof res.body.data.accessToken).toBe('string');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('/auth/refreshToken (POST) - falha com token inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/refreshToken')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('Perfil da conta', () => {
    it('/auth/me (GET) - obtém perfil da conta logada', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ Email: testUserEmail, Password: testUserPassword })
        .expect(200);

      const token = loginRes.body.data.accessToken;
      userId = loginRes.body.data.sub;

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `bearer ${token}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('Email');
      expect(res.body.data).toHaveProperty('Id');
      expect(res.body.data).toHaveProperty('Status');
      expect(res.body.data).not.toHaveProperty('Password');
      expect(res.body.data.Email).toBe(testUserEmail);
    });

    it('/auth/me (GET) - falha sem autenticação', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('Logout de conta', () => {
    it('/auth/signout (POST) - realiza logout da conta', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ Email: testUserEmail, Password: testUserPassword })
        .expect(200);
      const token = loginRes.body.data.accessToken;
      const rToken = loginRes.body.data.refreshToken;

      await request(app.getHttpServer())
        .post('/auth/signout')
        .set('Authorization', `bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/refreshToken')
        .send({ refreshToken: rToken })
        .expect(401);
    });
  });
});
