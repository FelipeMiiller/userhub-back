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

describe('Auth — Verificação de e-mail (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const account = accountFactory.build();
  const profile = profileFactory.build();
  const email = account.Email as string;
  const password = 'Verify@123';

  beforeAll(async () => {
    const testSetup = await createIdentityApp();
    app = testSetup.app;
    dataSource = testSetup.dataSource;

    // Cria account de teste
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ Email: email, Password: password, FirstName: profile.FirstName, LastName: profile.LastName })
      .expect(201);
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [email]);
    await app.close();
  });

  describe('GET /auth/verify-email', () => {
    it('retorna 400 com token inválido', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/verify-email?token=token-invalido-xxx')
        .expect(400);

      expect(res.body).toHaveProperty('message', 'Token inválido ou expirado');
    });

    it('retorna 400 com token ausente', async () => {
      await request(app.getHttpServer()).get('/auth/verify-email').expect(400);
    });
  });

  describe('POST /auth/resend-verification', () => {
    it('reenvio bem-sucedido para e-mail cadastrado', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ Email: email })
        .expect(200);

      expect(res.body).toHaveProperty('data.message', 'E-mail de verificação enviado');
    });

    it('retorna 404 para e-mail não cadastrado', async () => {
      await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ Email: 'naoexiste@example.com' })
        .expect(404);
    });

    it('retorna 400 para e-mail inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ Email: 'nao-eh-um-email' })
        .expect(400);
    });
  });
});
