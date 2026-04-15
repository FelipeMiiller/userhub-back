import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IdentityPermissions } from '@hub/shared-module/authorization';
import { createIdentityApp, grantPermissionsViaTable } from '../../../__tests__/e2e/setup';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

describe('SystemModules & SystemResources (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const email = `e2e_sysmod_${Date.now()}@example.com`;
  const password = 'SysMod@123';
  let accountId: string;
  let tenantId: string;
  let accessToken: string;

  const allPermissions = [
    IdentityPermissions.CATALOG_MODULE_LIST,
    IdentityPermissions.CATALOG_MODULE_VIEW,
  ];

  beforeAll(async () => {
    const testSetup = await createIdentityApp();
    app = testSetup.app;
    dataSource = testSetup.dataSource;

    // Cria account
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ Email: email, Password: password, FirstName: 'SysMod', LastName: 'Test' })
      .expect(201);
    accountId = signupRes.body.data.Id;

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ Email: email, Password: password })
      .expect(200);
    accessToken = loginRes.body.data.accessToken;

    // Cria tenant via onboarding
    const onboardingRes = await request(app.getHttpServer())
      .post('/auth/onboarding/tenant')
      .set('Authorization', `bearer ${accessToken}`)
      .send({ Name: 'SysModTenant', Slug: `sysmod-tenant-${Date.now()}` })
      .expect(201);
    tenantId = onboardingRes.body.data.tenant.Id;

    // Concede permissões e re-loga
    await grantPermissionsViaTable(dataSource, accountId, tenantId, allPermissions);
    const tokenRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ Email: email, Password: password })
      .expect(200);
    accessToken = tokenRes.body.data.accessToken;
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [email]);
    await app.close();
  });

  // ─── SystemModules ────────────────────────────────────────────────────────

  describe('GET /catalog/modules', () => {
    it('retorna lista de módulos do sistema', async () => {
      const res = await request(app.getHttpServer())
        .get('/catalog/modules')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get('/catalog/modules').expect(401);
    });
  });

  describe('GET /catalog/modules/:id', () => {
    let moduleId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get('/catalog/modules')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);
      moduleId = res.body.data[0]?.Id;
    });

    it('retorna o módulo por ID', async () => {
      if (!moduleId) return;
      const res = await request(app.getHttpServer())
        .get(`/catalog/modules/${moduleId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(res.body.data).toHaveProperty('Id', moduleId);
    });

    it('retorna 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/catalog/modules/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });
  });

  // ─── SystemResources ──────────────────────────────────────────────────────

  describe('GET /catalog/modules/:moduleId/resources', () => {
    let moduleId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get('/catalog/modules')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);
      moduleId = res.body.data[0]?.Id;
    });

    it('lista recursos do módulo', async () => {
      if (!moduleId) return;
      const res = await request(app.getHttpServer())
        .get(`/catalog/modules/${moduleId}/resources`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get(`/catalog/modules/any-id/resources`).expect(401);
    });
  });

  describe('GET /catalog/modules/:moduleId/resources/:id', () => {
    let moduleId: string;
    let resourceId: string;

    beforeAll(async () => {
      const modulesRes = await request(app.getHttpServer())
        .get('/catalog/modules')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);
      moduleId = modulesRes.body.data[0]?.Id;

      if (moduleId) {
        const resourcesRes = await request(app.getHttpServer())
          .get(`/catalog/modules/${moduleId}/resources`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .expect(200);
        resourceId = resourcesRes.body.data[0]?.Id;
      }
    });

    it('retorna o recurso por ID', async () => {
      if (!moduleId || !resourceId) return;
      const res = await request(app.getHttpServer())
        .get(`/catalog/modules/${moduleId}/resources/${resourceId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(res.body.data).toHaveProperty('Id', resourceId);
    });

    it('retorna 404 para ID inexistente', async () => {
      if (!moduleId) return;
      await request(app.getHttpServer())
        .get(`/catalog/modules/${moduleId}/resources/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });
  });
});
