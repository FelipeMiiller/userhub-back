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
import { permissionFactory } from '../../../__tests__/factory/permission.test-factory';
import { tenantModuleFactory } from '../../../__tests__/factory/tenant-module.test-factory';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

/**
 * Concede as permissões indicadas via AccountTenantPermissions direto no banco,
 * depois re-loga para obter um token com os grants embutidos.
 */
async function grantAllPermissionsAndRelogin(
  app: INestApplication,
  dataSource: DataSource,
  accountId: string,
  tenantId: string,
  email: string,
  password: string,
  extraPermissions?: string[],
): Promise<string> {
  const permissions = [
    IdentityPermissions.TENANT_VIEW,
    IdentityPermissions.TENANT_UPDATE,
    IdentityPermissions.ACCOUNT_TENANT_LIST,
    IdentityPermissions.ACCOUNT_TENANT_CREATE,
    IdentityPermissions.ACCOUNT_TENANT_DELETE,
    IdentityPermissions.TENANT_ROLE_LIST,
    IdentityPermissions.TENANT_ROLE_VIEW,
    IdentityPermissions.TENANT_ROLE_CREATE,
    IdentityPermissions.TENANT_ROLE_UPDATE,
    IdentityPermissions.TENANT_ROLE_DELETE,
    ...(extraPermissions ?? []),
  ];

  await grantPermissionsViaTable(dataSource, accountId, tenantId, permissions);

  const loginRes = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ Email: email, Password: password })
    .expect(200);

  return loginRes.body.data.accessToken as string;
}

describe('Onboarding & Tenant (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const account = accountFactory.build();
  const profileData = profileFactory.build();
  const tenantData = tenantFactory.build();
  const email = account.Email as string;
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
      .send({ Email: email, Password: password, FirstName: profileData.FirstName, LastName: profileData.LastName })
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
    it('cria tenant e membership para o account autenticado', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/onboarding/tenant')
        .set('Authorization', `bearer ${accessToken}`)
        .send({ Name: tenantData.Name, Slug: tenantData.Slug })
        .expect(201);

      expect(res.body.data).toHaveProperty('tenant');
      expect(res.body.data).toHaveProperty('membership');
      expect(res.body.data.tenant.Slug).toBe(tenantData.Slug);
      tenantId = res.body.data.tenant.Id;

      // Concede permissões e re-loga para token com claims corretos
      accessToken = await grantAllPermissionsAndRelogin(
        app,
        dataSource,
        accountId,
        tenantId,
        email,
        password,
      );
    });

    it('retorna 409 para slug já em uso', async () => {
      await request(app.getHttpServer())
        .post('/auth/onboarding/tenant')
        .set('Authorization', `bearer ${accessToken}`)
        .send({ Name: tenantFactory.build().Name, Slug: tenantData.Slug })
        .expect(409);
    });

    it('retorna 400 para campos obrigatórios ausentes', async () => {
      await request(app.getHttpServer())
        .post('/auth/onboarding/tenant')
        .set('Authorization', `bearer ${accessToken}`)
        .send({ Name: tenantFactory.build().Name })
        .expect(400);
    });

    it('retorna 401 sem autenticação', async () => {
      const t = tenantFactory.build();
      await request(app.getHttpServer())
        .post('/auth/onboarding/tenant')
        .send({ Name: t.Name, Slug: t.Slug })
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

    it('retorna 403 para tenant inexistente (guard rejeita antes do service)', async () => {
      await request(app.getHttpServer())
        .get('/tenants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .expect(403);
    });

    it('retorna 401 sem autenticação', async () => {
      await request(app.getHttpServer()).get(`/tenants/${tenantId}`).expect(401);
    });
  });

  describe('PATCH /tenants/:id', () => {
    it('atualiza nome do tenant', async () => {
      const updatedName = tenantFactory.build().Name!;
      const res = await request(app.getHttpServer())
        .patch(`/tenants/${tenantId}`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: updatedName })
        .expect(200);

      expect(res.body.data.Name).toBe(updatedName);
    });

    it('retorna 403 para tenant inexistente (guard rejeita antes do service)', async () => {
      await request(app.getHttpServer())
        .patch('/tenants/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: tenantFactory.build().Name })
        .expect(403);
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
    const secondAccount = accountFactory.build();
    const secondProfile = profileFactory.build();

    beforeAll(async () => {
      const signupRes = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ Email: secondAccount.Email, Password: 'Member@123', FirstName: secondProfile.FirstName, LastName: secondProfile.LastName })
        .expect(201);
      secondAccountId = signupRes.body.data.Id;
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [secondAccount.Email]);
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
    const memberAccount = accountFactory.build();
    const memberProfile = profileFactory.build();

    beforeAll(async () => {
      const signupRes = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          Email: memberAccount.Email,
          Password: 'DelMember@123',
          FirstName: memberProfile.FirstName,
          LastName: memberProfile.LastName,
        })
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
      await dataSource.query(`DELETE FROM "Accounts" WHERE "Email" = $1`, [memberAccount.Email]);
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
      const role = tenantFactory.build();
      const res = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: role.Name, Description: role.Name })
        .expect(201);

      expect(res.body.data).toHaveProperty('Name', role.Name);
      expect(res.body.data).toHaveProperty('TenantId', tenantId);
    });

    it('retorna 400 para role sem nome', async () => {
      await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Description: tenantFactory.build().Name })
        .expect(400);
    });
  });

  describe('Tenant Modules /tenants/:tenantId/modules', () => {
    let systemModuleId: string;

    beforeAll(async () => {
      // Garante permissões de tenant-module no token
      accessToken = await grantAllPermissionsAndRelogin(
        app,
        dataSource,
        accountId,
        tenantId,
        email,
        password,
        [
          IdentityPermissions.TENANT_MODULE_LIST,
          IdentityPermissions.TENANT_MODULE_CREATE,
          IdentityPermissions.TENANT_MODULE_DELETE,
        ],
      );

      // Cria um SystemModule diretamente no banco para os testes
      const sysModule = systemModuleFactory.build();
      const result = await dataSource.query(
        `INSERT INTO "SystemModules" ("Id", "Slug", "Name", "Description", "Active", "CreatedAt", "UpdatedAt")
         VALUES ($1, $2, $3, $4, true, now(), now())
         RETURNING "Id"`,
        [sysModule.Id, sysModule.Slug, sysModule.Name, sysModule.Description],
      );
      systemModuleId = result[0].Id;
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM "TenantModules" WHERE "TenantId" = $1`, [tenantId]);
      await dataSource.query(`DELETE FROM "SystemModules" WHERE "Id" = $1`, [systemModuleId]);
    });

    describe('GET /tenants/:tenantId/modules', () => {
      it('retorna lista vazia inicialmente', async () => {
        const res = await request(app.getHttpServer())
          .get(`/tenants/${tenantId}/modules`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .expect(200);

        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('retorna 401 sem autenticação', async () => {
        await request(app.getHttpServer()).get(`/tenants/${tenantId}/modules`).expect(401);
      });
    });

    describe('POST /tenants/:tenantId/modules', () => {
      it('habilita um módulo para o tenant', async () => {
        const res = await request(app.getHttpServer())
          .post(`/tenants/${tenantId}/modules`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .send({ SystemModuleId: systemModuleId })
          .expect(201);

        expect(res.body.data).toHaveProperty('TenantId', tenantId);
        expect(res.body.data).toHaveProperty('SystemModuleId', systemModuleId);
        expect(res.body.data).toHaveProperty('Status', 'active');
      });

      it('retorna 409 se o módulo já está ativo para o tenant', async () => {
        await request(app.getHttpServer())
          .post(`/tenants/${tenantId}/modules`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .send({ SystemModuleId: systemModuleId })
          .expect(409);
      });

      it('retorna 404 para SystemModule inexistente', async () => {
        await request(app.getHttpServer())
          .post(`/tenants/${tenantId}/modules`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .send({ SystemModuleId: '00000000-0000-0000-0000-000000000000' })
          .expect(404);
      });

      it('retorna 400 para body inválido', async () => {
        await request(app.getHttpServer())
          .post(`/tenants/${tenantId}/modules`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .send({})
          .expect(400);
      });
    });

    describe('DELETE /tenants/:tenantId/modules/:moduleId', () => {
      it('desabilita o módulo do tenant', async () => {
        await request(app.getHttpServer())
          .delete(`/tenants/${tenantId}/modules/${systemModuleId}`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .expect(204);
      });

      it('retorna 404 para módulo não habilitado', async () => {
        await request(app.getHttpServer())
          .delete(`/tenants/${tenantId}/modules/00000000-0000-0000-0000-000000000000`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .expect(404);
      });
    });
  });

  describe('Role Permissions /tenants/:tenantId/roles/:id/permissions', () => {
    let roleId: string;
    let permissionId: string;
    let systemModuleId: string;

    beforeAll(async () => {
      // Cria SystemModule e habilita-o no tenant
      const sysModule = systemModuleFactory.build();
      const moduleResult = await dataSource.query(
        `INSERT INTO "SystemModules" ("Id", "Slug", "Name", "Description", "Active", "CreatedAt", "UpdatedAt")
         VALUES ($1, $2, $3, $4, true, now(), now())
         RETURNING "Id"`,
        [sysModule.Id, sysModule.Slug, sysModule.Name, sysModule.Description],
      );
      systemModuleId = moduleResult[0].Id;

      // Habilita módulo no tenant
      const tm = tenantModuleFactory.build({ TenantId: tenantId, SystemModuleId: systemModuleId });
      await dataSource.query(
        `INSERT INTO "TenantModules" ("Id", "TenantId", "SystemModuleId", "Status", "CreatedAt", "UpdatedAt")
         VALUES ($1, $2, $3, 'active', now(), now())`,
        [tm.Id, tenantId, systemModuleId],
      );

      // Cria SystemResource para a permission
      const sysResource = systemResourceFactory.build({ ModuleId: systemModuleId });
      const resourceResult = await dataSource.query(
        `INSERT INTO "SystemResources" ("Id", "Slug", "Name", "ModuleId", "CreatedAt", "UpdatedAt")
         VALUES ($1, $2, $3, $4, now(), now())
         RETURNING "Id"`,
        [sysResource.Id, sysResource.Slug, sysResource.Name, systemModuleId],
      );
      const resourceId = resourceResult[0].Id;

      // Cria Permission
      const perm = permissionFactory.build({ ModuleId: systemModuleId, ResourceId: resourceId, Action: 'read' });
      const permResult = await dataSource.query(
        `INSERT INTO "Permissions" ("Id", "Name", "ModuleId", "ResourceId", "Action", "CreatedAt", "UpdatedAt")
         VALUES ($1, $2, $3, $4, $5, now(), now())
         RETURNING "Id"`,
        [perm.Id, perm.Name, systemModuleId, resourceId, perm.Action],
      );
      permissionId = permResult[0].Id;

      // Cria role para os testes de permissão
      const roleData = tenantFactory.build();
      const roleRes = await request(app.getHttpServer())
        .post(`/tenants/${tenantId}/roles`)
        .set('Authorization', `bearer ${accessToken}`)
        .set('x-tenant-id', tenantId)
        .send({ Name: roleData.Name, Description: roleData.Name })
        .expect(201);
      roleId = roleRes.body.data.Id;
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM "TenantRolePermissions" WHERE "TenantRoleId" = $1`, [
        roleId,
      ]);
      await dataSource.query(`DELETE FROM "TenantRoles" WHERE "Id" = $1`, [roleId]);
      await dataSource.query(`DELETE FROM "Permissions" WHERE "Id" = $1`, [permissionId]);
      await dataSource.query(
        `DELETE FROM "TenantModules" WHERE "TenantId" = $1 AND "SystemModuleId" = $2`,
        [tenantId, systemModuleId],
      );
      await dataSource.query(`DELETE FROM "SystemModules" WHERE "Id" = $1`, [systemModuleId]);
    });

    describe('GET /tenants/:tenantId/roles/:id/permissions', () => {
      it('lista permissões do role (vazio inicialmente)', async () => {
        const res = await request(app.getHttpServer())
          .get(`/tenants/${tenantId}/roles/${roleId}/permissions`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .expect(200);

        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(0);
      });
    });

    describe('POST /tenants/:tenantId/roles/:id/permissions', () => {
      it('adiciona permissão ao role', async () => {
        const res = await request(app.getHttpServer())
          .post(`/tenants/${tenantId}/roles/${roleId}/permissions`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .send({ PermissionId: permissionId, AllowedLevel: 1, Mode: 'allow' })
          .expect(201);

        expect(res.body.data).toHaveProperty('TenantRoleId', roleId);
        expect(res.body.data).toHaveProperty('PermissionId', permissionId);
      });

      it('retorna 404 para permissão inexistente', async () => {
        await request(app.getHttpServer())
          .post(`/tenants/${tenantId}/roles/${roleId}/permissions`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .send({
            PermissionId: '00000000-0000-0000-0000-000000000000',
            AllowedLevel: 1,
            Mode: 'allow',
          })
          .expect(404);
      });

      it('retorna 403 se módulo não está habilitado no tenant', async () => {
        // Desabilita o módulo temporariamente
        await dataSource.query(
          `UPDATE "TenantModules" SET "Status" = 'inactive' WHERE "TenantId" = $1 AND "SystemModuleId" = $2`,
          [tenantId, systemModuleId],
        );

        await request(app.getHttpServer())
          .post(`/tenants/${tenantId}/roles/${roleId}/permissions`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .send({ PermissionId: permissionId, AllowedLevel: 1, Mode: 'allow' })
          .expect(403);

        // Reativa
        await dataSource.query(
          `UPDATE "TenantModules" SET "Status" = 'active' WHERE "TenantId" = $1 AND "SystemModuleId" = $2`,
          [tenantId, systemModuleId],
        );
      });
    });

    describe('DELETE /tenants/:tenantId/roles/:roleId/permissions/:id', () => {
      it('remove permissão do role', async () => {
        const perms = await dataSource.query(
          `SELECT "Id" FROM "TenantRolePermissions" WHERE "TenantRoleId" = $1 AND "PermissionId" = $2`,
          [roleId, permissionId],
        );
        expect(perms.length).toBeGreaterThan(0);
        const rolePermId = perms[0].Id;

        await request(app.getHttpServer())
          .delete(`/tenants/${tenantId}/roles/${roleId}/permissions/${rolePermId}`)
          .set('Authorization', `bearer ${accessToken}`)
          .set('x-tenant-id', tenantId)
          .expect(204);
      });
    });
  });
});
