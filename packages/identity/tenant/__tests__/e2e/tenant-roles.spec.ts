import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IdentityPermissions } from '@hub/shared-module/authorization';
import { createIdentityApp, grantPermissionsViaTable } from '../../../__tests__/e2e/setup';
import { accountFactory } from '../../../__tests__/factory/account.test-factory';
import { profileFactory } from '../../../__tests__/factory/profile.test-factory';
import { tenantFactory } from '../../../__tests__/factory/tenant.test-factory';
import { tenantRoleFactory } from '../../../__tests__/factory/tenant-role.test-factory';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

describe('TenantRoles — GET/:id, PATCH/:id, DELETE/:id (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const account = accountFactory.build();
  const profileData = profileFactory.build();
  const tenantData = tenantFactory.build();
  const email = account.Email as string;
  const password = 'Roles@123';
  let accountId: string;
  let tenantId: string;
  let accessToken: string;

  const allPermissions = [
    IdentityPermissions.TENANT_ROLE_LIST,
    IdentityPermissions.TENANT_ROLE_VIEW,
    IdentityPermissions.TENANT_ROLE_CREATE,
    IdentityPermissions.TENANT_ROLE_UPDATE,
    IdentityPermissions.TENANT_ROLE_DELETE,
  ];

  beforeAll(async () => {
    const testSetup = await createIdentityApp();
    app = testSetup.app;
    dataSource = testSetup.dataSource;

    // Cria account
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ Email: email, Password: password, FirstName: profileData.FirstName, LastName: profileData.LastName })
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
      .send({ Name: tenantData.Name, Slug: tenantData.Slug })
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

  describe('GET /tenants/:tenantId/roles/:id', () => {
    let roleId: string;

    beforeAll(async () => {
      const role = tenantRoleFactory.build();
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: role.Name, Description: role.Description })
        .expect(201);
      roleId = res.body.data.Id;
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM "TenantRoles" WHERE "Id" = $1`, [roleId]);
    });

    it('retorna o role por ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/roles/${roleId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(res.body.data).toHaveProperty('Id', roleId);
      expect(res.body.data).toHaveProperty('TenantId', tenantId);
    });

    it('retorna 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/roles/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get(`/tenants/${tenantId}/roles/${roleId}`).expect(401);
    });

    it('retorna 403 para tenant diferente do token', async () => {
      await request(app.getHttpServer())
        .get(`/tenants/00000000-0000-0000-0000-000000000000/roles/${roleId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', '00000000-0000-0000-0000-000000000000')
        .expect(403);
    });
  });

  describe('PATCH /tenants/:tenantId/roles/:id', () => {
    let roleId: string;

    beforeAll(async () => {
      const role = tenantRoleFactory.build();
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: role.Name, Description: role.Description })
        .expect(201);
      roleId = res.body.data.Id;
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM "TenantRoles" WHERE "Id" = $1`, [roleId]);
    });

    it('atualiza o nome do role', async () => {
      const updatedRole = tenantRoleFactory.build();
      const res = await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/roles/${roleId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: updatedRole.Name })
        .expect(200);

      expect(res.body.data).toHaveProperty('Name', updatedRole.Name);
    });

    it('atualiza a descrição do role', async () => {
      const updatedRole = tenantRoleFactory.build();
      const res = await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/roles/${roleId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Description: updatedRole.Description })
        .expect(200);

      expect(res.body.data).toHaveProperty('Description', updatedRole.Description);
    });

    it('retorna 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/roles/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: tenantRoleFactory.build().Name })
        .expect(404);
    });
  });

  describe('DELETE /tenants/:tenantId/roles/:id', () => {
    let roleId: string;

    beforeAll(async () => {
      const role = tenantRoleFactory.build();
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: role.Name, Description: role.Description })
        .expect(201);
      roleId = res.body.data.Id;
    });

    it('remove o role', async () => {
      await request(app.getHttpServer())
        .delete(`/tenants/${tenantId}/roles/${roleId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(204);
    });

    it('role foi removido — GET retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/tenants/${tenantId}/roles/${roleId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).delete(`/tenants/${tenantId}/roles/${roleId}`).expect(401);
    });
  });
});
