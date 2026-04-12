import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createIdentityApp } from '../../../__tests__/e2e/setup';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

/**
 * Concede todas as permissões necessárias via ExtraPermissions direto no banco,
 * depois re-loga para obter um token com os grants embutidos.
 */
async function grantAllPermissionsAndRelogin(
  app: INestApplication,
  dataSource: DataSource,
  accountId: string,
  tenantId: string,
  email: string,
  password: string,
): Promise<string> {
  const permissions = [
    'identity.tenant.view',
    'identity.tenant.update',
    'identity.account-tenant.list',
    'identity.account-tenant.create',
    'identity.account-tenant.delete',
    'identity.tenant-role.list',
    'identity.tenant-role.view',
    'identity.tenant-role.create',
    'identity.tenant-role.update',
    'identity.tenant-role.delete',
  ];

  await dataSource.query(
    `UPDATE "AccountTenants"
     SET "ExtraPermissions" = $1::jsonb
     WHERE "AccountId" = $2 AND "TenantId" = $3`,
    [JSON.stringify({ grant: permissions }), accountId, tenantId],
  );

  const loginRes = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ Email: email, Password: password })
    .expect(200);

  return loginRes.body.data.accessToken as string;
}

describe('Onboarding & Tenant (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const email = `e2e_tenant_${Date.now()}@example.com`;
  const password = 'Tenant@123';
  let accountId: string;
  let tenantId: string;
  let accessToken: string;

  beforeAll(async () => {
    const testSetup = await createIdentityApp();
    app = testSetup.app;
    dataSource = testSetup.dataSource;

    // 1. Cria account
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ Email: email, Password: password, FirstName: 'Tenant', LastName: 'Owner' })
      .expect(201);
    accountId = signupRes.body.data.Id;

    // 2. Login inicial
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

  describe('POST /auth/onboarding/tenant', () => {
    const slug = `e2e-slug-${Date.now()}`;

    it('cria tenant e membership para o account autenticado', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/onboarding/tenant')
        .set('Authorization', `bearer ${accessToken}`)
        .send({ Name: 'E2E Tenant', Slug: slug })
        .expect(201);

      expect(res.body.data).toHaveProperty('tenant');
      expect(res.body.data).toHaveProperty('membership');
      expect(res.body.data.tenant.Slug).toBe(slug);
      tenantId = res.body.data.tenant.Id;

      // Concede permissões e re-loga para token com claims corretos
      accessToken = await grantAllPermissionsAndRelogin(
        app, dataSource, accountId, tenantId, email, password,
      );
    });

    it('retorna 409 para slug já em uso', async () => {
      await request(app.getHttpServer())
        .post('/auth/onboarding/tenant')
        .set('Authorization', `bearer ${accessToken}`)
        .send({ Name: 'Outro Tenant', Slug: slug })
        .expect(409);
    });

    it('retorna 400 para campos obrigatórios ausentes', async () => {
      await request(app.getHttpServer())
        .post('/auth/onboarding/tenant')
        .set('Authorization', `bearer ${accessToken}`)
        .send({ Name: 'Sem Slug' })
        .expect(400);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .post('/auth/onboarding/tenant')
        .send({ Name: 'Não Autorizado', Slug: `sem-auth-${Date.now()}` })
        .expect(401);
    });
  });

  describe('GET /tenants/:id', () => {
    it('retorna o tenant pelo ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(res.body.data).toHaveProperty('Id', tenantId);
    });

    it('retorna 404 para tenant inexistente', async () => {
      await request(app.getHttpServer())
        .get('/tenants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}`)
        .expect(401);
    });
  });

  describe('PATCH /tenants/:id', () => {
    it('atualiza nome do tenant', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: 'Tenant Atualizado' })
        .expect(200);

      expect(res.body.data.Name).toBe('Tenant Atualizado');
    });

    it('retorna 404 para tenant inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/tenants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: 'Não Existe' })
        .expect(404);
    });
  });

  describe('GET /tenants/:tenantId/members', () => {
    it('lista membros do tenant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/members`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /tenants/:tenantId/members', () => {
    let secondAccountId: string;
    const secondEmail = `e2e_member_${Date.now()}@example.com`;

    beforeAll(async () => {
      const signupRes = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ Email: secondEmail, Password: 'Member@123', FirstName: 'Member', LastName: 'Test' })
        .expect(201);
      secondAccountId = signupRes.body.data.Id;
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [secondEmail]);
    });

    it('adiciona account ao tenant', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/members`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ AccountId: secondAccountId })
        .expect(201);

      expect(res.body.data).toHaveProperty('AccountId', secondAccountId);
      expect(res.body.data).toHaveProperty('TenantId', tenantId);
    });

    it('retorna 409 se o account já é membro', async () => {
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/members`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ AccountId: secondAccountId })
        .expect(409);
    });

    it('retorna 404 para account inexistente', async () => {
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/members`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ AccountId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });
  });

  describe('DELETE /tenants/:tenantId/members/:accountId', () => {
    let memberAccountId: string;
    const memberEmail = `e2e_del_member_${Date.now()}@example.com`;

    beforeAll(async () => {
      const signupRes = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ Email: memberEmail, Password: 'DelMember@123', FirstName: 'Del', LastName: 'Member' })
        .expect(201);
      memberAccountId = signupRes.body.data.Id;

      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/members`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ AccountId: memberAccountId })
        .expect(201);
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [memberEmail]);
    });

    it('remove account do tenant', async () => {
      await request(app.getHttpServer())
        .delete(`/tenants/${tenantId}/members/${memberAccountId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(204);
    });

    it('retorna 404 para membership inexistente', async () => {
      await request(app.getHttpServer())
        .delete(`/tenants/${tenantId}/members/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });
  });

  describe('GET /tenants/:tenantId/roles', () => {
    it('lista roles do tenant (vazio inicialmente)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /tenants/:tenantId/roles', () => {
    it('cria um role para o tenant', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: 'Admin', Description: 'Role administrativo' })
        .expect(201);

      expect(res.body.data).toHaveProperty('Name', 'Admin');
      expect(res.body.data).toHaveProperty('TenantId', tenantId);
    });

    it('retorna 400 para role sem nome', async () => {
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Description: 'Sem nome' })
        .expect(400);
    });
  });
});
