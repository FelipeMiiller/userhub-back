import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IdentityPermissions } from '@hub/shared-module/authorization';
import { createIdentityApp, grantPermissionsViaTable } from '../../../__tests__/e2e/setup';
import { accountFactory } from '../../../__tests__/factory/account.test-factory';
import { profileFactory } from '../../../__tests__/factory/profile.test-factory';
import { tenantFactory } from '../../../__tests__/factory/tenant.test-factory';
import { systemModuleFactory } from '../../../__tests__/factory/system-module.test-factory';
import { systemResourceFactory } from '../../../__tests__/factory/system-resource.test-factory';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

describe('PermissionCatalog (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const account = accountFactory.build();
  const profile = profileFactory.build();
  const tenant = tenantFactory.build();
  const email = account.Email as string;
  const password = 'PermCat@123';
  let accountId: string;
  let tenantId: string;
  let accessToken: string;

  // IDs de suporte criados no banco
  let systemModuleId: string;
  let systemResourceId: string;

  const allPermissions = [
    IdentityPermissions.PERMISSION_LIST,
    IdentityPermissions.PERMISSION_VIEW,
    IdentityPermissions.PERMISSION_CREATE,
    IdentityPermissions.PERMISSION_DELETE,
  ];

  beforeAll(async () => {
    const testSetup = await createIdentityApp();
    app = testSetup.app;
    dataSource = testSetup.dataSource;

    // Cria account
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ Email: email, Password: password, FirstName: profile.FirstName, LastName: profile.LastName })
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
      .send({ Name: tenant.Name, Slug: tenant.Slug })
      .expect(201);
    tenantId = onboardingRes.body.data.tenant.Id;

    // Cria SystemModule de suporte diretamente no banco
    const sysModule = systemModuleFactory.build();
    const modResult = await dataSource.query(
      `INSERT INTO "SystemModules" ("Id", "Slug", "Name", "Active", "CreatedAt", "UpdatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())
       RETURNING "Id"`,
      [sysModule.Id, sysModule.Slug, sysModule.Name],
    );
    systemModuleId = modResult[0].Id;

    // Cria SystemResource de suporte
    const sysResource = systemResourceFactory.build({ ModuleId: systemModuleId });
    const resResult = await dataSource.query(
      `INSERT INTO "SystemResources" ("Id", "Slug", "Name", "ModuleId", "Active", "CreatedAt", "UpdatedAt")
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING "Id"`,
      [sysResource.Id, sysResource.Slug, sysResource.Name, systemModuleId],
    );
    systemResourceId = resResult[0].Id;

    // Concede permissões e re-loga
    await grantPermissionsViaTable(dataSource, accountId, tenantId, allPermissions);
    const tokenRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ Email: email, Password: password })
      .expect(200);
    accessToken = tokenRes.body.data.accessToken;
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM "SystemResources" WHERE "Id" = $1`, [systemResourceId]);
    await dataSource.query(`DELETE FROM "SystemModules" WHERE "Id" = $1`, [systemModuleId]);
    await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [email]);
    await app.close();
  });

  // ─── GET /permissions ──────────────────────────────────────────────────────

  describe('GET /permissions', () => {
    it('retorna lista de permissões', async () => {
      const res = await request(app.getHttpServer())
        .get('/permissions')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get('/permissions').expect(401);
    });
  });

  // ─── POST /permissions ─────────────────────────────────────────────────────

  describe('POST /permissions', () => {
    let createdPermissionId: string;

    afterAll(async () => {
      if (createdPermissionId) {
        await dataSource.query(`DELETE FROM "Permissions" WHERE "Id" = $1`, [createdPermissionId]);
      }
    });

    it('cria uma permissão com Name gerado automaticamente', async () => {
      const res = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          ModuleId: systemModuleId,
          ResourceId: systemResourceId,
          Action: 'read',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('ModuleId', systemModuleId);
      expect(res.body.data).toHaveProperty('ResourceId', systemResourceId);
      expect(res.body.data).toHaveProperty('Action', 'read');
      expect(res.body.data).toHaveProperty('Name');
      createdPermissionId = res.body.data.Id;
    });

    it('retorna 400 para body sem ModuleId', async () => {
      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ ResourceId: systemResourceId, Action: 'read' })
        .expect(400);
    });

    it('retorna 400 para body sem ResourceId', async () => {
      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ ModuleId: systemModuleId, Action: 'write' })
        .expect(400);
    });

    it('retorna 400 para body sem Action', async () => {
      await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ ModuleId: systemModuleId, ResourceId: systemResourceId })
        .expect(400);
    });
  });

  // ─── GET /permissions/:id ──────────────────────────────────────────────────

  describe('GET /permissions/:id', () => {
    let permissionId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          ModuleId: systemModuleId,
          ResourceId: systemResourceId,
          Action: 'view',
        })
        .expect(201);
      permissionId = res.body.data.Id;
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM "Permissions" WHERE "Id" = $1`, [permissionId]);
    });

    it('retorna a permissão por ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/permissions/${permissionId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(200);

      expect(res.body.data).toHaveProperty('Id', permissionId);
      expect(res.body.data).toHaveProperty('Action', 'view');
    });

    it('retorna 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/permissions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });
  });

  // ─── DELETE /permissions/:id ───────────────────────────────────────────────

  describe('DELETE /permissions/:id', () => {
    let permissionId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/permissions')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          ModuleId: systemModuleId,
          ResourceId: systemResourceId,
          Action: 'delete',
        })
        .expect(201);
      permissionId = res.body.data.Id;
    });

    it('remove a permissão', async () => {
      await request(app.getHttpServer())
        .delete(`/permissions/${permissionId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(204);
    });

    it('permissão removida — GET retorna 404', async () => {
      await request(app.getHttpServer())
        .get(`/permissions/${permissionId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(404);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).delete(`/permissions/${permissionId}`).expect(401);
    });
  });
});
