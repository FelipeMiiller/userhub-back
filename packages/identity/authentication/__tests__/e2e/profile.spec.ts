import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createIdentityApp } from '../../../__tests__/e2e/setup';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

describe('Profile (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const email = `e2e_profile_${Date.now()}@example.com`;
  const password = 'Profile@123';
  let accountId: string;
  let profileId: string;
  let tenantId: string;
  let accessToken: string;

  beforeAll(async () => {
    const testSetup = await createIdentityApp();
    app = testSetup.app;
    dataSource = testSetup.dataSource;

    // 1. Cria account
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ Email: email, Password: password, FirstName: 'Profile', LastName: 'User' })
      .expect(201);
    accountId = signupRes.body.data.Id;

    // 2. Login inicial
    let loginRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ Email: email, Password: password })
      .expect(200);
    accessToken = loginRes.body.data.accessToken;

    // 3. Cria tenant para poder testar rotas com PermissionGuard
    const onboardingRes = await request(app.getHttpServer())
      .post('/auth/onboarding/tenant')
      .set('Authorization', `bearer ${accessToken}`)
      .send({ Name: 'Profile Tenant', Slug: `profile-tenant-${Date.now()}` })
      .expect(201);
    tenantId = onboardingRes.body.data.tenant.Id;

    // 4. Concede permissões de profile via ExtraPermissions e re-loga
    await dataSource.query(
      `UPDATE "AccountTenants"
       SET "ExtraPermissions" = $1::jsonb
       WHERE "AccountId" = $2 AND "TenantId" = $3`,
      [
        JSON.stringify({ grant: ['identity.profile.view', 'identity.profile.update'] }),
        accountId,
        tenantId,
      ],
    );

    loginRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ Email: email, Password: password })
      .expect(200);
    accessToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [email]);
    await app.close();
  });

  describe('GET /profiles/me', () => {
    it('retorna o perfil do account autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/profiles/me')
        .set('Authorization', `bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('AccountId', accountId);
      expect(res.body.data.FirstName).toBe('profile');
      profileId = res.body.data.Id;
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get('/profiles/me').expect(401);
    });
  });

  describe('GET /profiles/:id', () => {
    it('retorna o perfil pelo ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/profiles/${profileId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(res.body.data).toHaveProperty('Id', profileId);
    });

    it('retorna 404 para perfil inexistente', async () => {
      await request(app.getHttpServer())
        .get('/profiles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get(`/profiles/${profileId}`).expect(401);
    });
  });

  describe('PATCH /profiles/:id', () => {
    it('atualiza o perfil', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/profiles/${profileId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ FirstName: 'Updated', LastName: 'Name' })
        .expect(200);

      expect(res.body.data.FirstName).toBe('updated');
      expect(res.body.data.LastName).toBe('name');
    });

    it('retorna 404 para perfil inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/profiles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ FirstName: 'Nope' })
        .expect(404);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .patch(`/profiles/${profileId}`)
        .send({ FirstName: 'Nope' })
        .expect(401);
    });
  });
});
