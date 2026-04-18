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

describe('Me / Profile (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const account = accountFactory.build();
  const profile = profileFactory.build();
  const email = account.Email as string;
  const password = 'Profile@123';
  let accountId: string;
  let accessToken: string;

  beforeAll(async () => {
    const testSetup = await createIdentityApp();
    app = testSetup.app;
    dataSource = testSetup.dataSource;

    // 1. Cria account
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ Email: email, Password: password, FirstName: profile.FirstName, LastName: profile.LastName })
      .expect(201);
    accountId = signupRes.body.data.Id;

    // 2. Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ Email: email, Password: password })
      .expect(200);
    accessToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [email]);
    await app.close();
  });

  describe('GET /auth/me', () => {
    it('retorna dados do account autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('Id', accountId);
      expect(res.body.data).toHaveProperty('Email', email);
      expect(res.body.data).toHaveProperty('Status');
      expect(res.body.data).not.toHaveProperty('Password');
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('PATCH /auth/me', () => {
    it('atualiza dados do account autenticado', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `bearer ${accessToken}`)
        .send({ FirstName: 'Updated' })
        .expect(200);

      expect(res.body.data).toHaveProperty('Id', accountId);
      expect(res.body.data).toHaveProperty('Email', email);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).patch('/auth/me').send({ FirstName: 'Nope' }).expect(401);
    });
  });
});
