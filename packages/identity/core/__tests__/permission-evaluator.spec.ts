import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createIdentityApp } from '../../__tests__/e2e/setup';
import { PermissionEvaluatorService } from '../services/permission-evaluator.service';
import { accountFactory } from '../../__tests__/factory/account.test-factory';
import { tenantFactory } from '../../__tests__/factory/tenant.test-factory';
import { accountTenantFactory } from '../../__tests__/factory/account-tenant.test-factory';
import { tenantRoleFactory } from '../../__tests__/factory/tenant-role.test-factory';
import { systemModuleFactory } from '../../__tests__/factory/system-module.test-factory';
import { systemResourceFactory } from '../../__tests__/factory/system-resource.test-factory';
import { permissionFactory } from '../../__tests__/factory/permission.test-factory';
import { tenantRolePermissionFactory } from '../../__tests__/factory/tenant-role-permission.test-factory';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

async function insertAccount(ds: DataSource, overrides: Partial<ReturnType<typeof accountFactory.build>> = {}) {
  const data = accountFactory.build(overrides);
  await ds.query(
    `INSERT INTO "Accounts" ("Id","Email","Password","Provider","Status","EmailVerified","CreatedAt","UpdatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
    [data.Id, data.Email, data.Password, data.Provider, data.Status, data.EmailVerified],
  );
  return data;
}

async function insertTenant(ds: DataSource, overrides: Partial<ReturnType<typeof tenantFactory.build>> = {}) {
  const data = tenantFactory.build(overrides);
  await ds.query(
    `INSERT INTO "Tenants" ("Id","Name","Slug","Status","CreatedAt","UpdatedAt")
     VALUES ($1,$2,$3,$4,NOW(),NOW())`,
    [data.Id, data.Name, data.Slug, data.Status],
  );
  return data;
}

async function insertTenantRole(ds: DataSource, tenantId: string, overrides: Partial<ReturnType<typeof tenantRoleFactory.build>> = {}) {
  const data = tenantRoleFactory.build({ TenantId: tenantId, ...overrides });
  await ds.query(
    `INSERT INTO "TenantRoles" ("Id","TenantId","Name","Description","CreatedAt","UpdatedAt")
     VALUES ($1,$2,$3,$4,NOW(),NOW())`,
    [data.Id, data.TenantId, data.Name, data.Description],
  );
  return data;
}

async function insertMembership(
  ds: DataSource,
  accountId: string,
  tenantId: string,
  roleId: string | null = null,
  overrides: Partial<ReturnType<typeof accountTenantFactory.build>> = {},
) {
  const data = accountTenantFactory.build({
    AccountId: accountId,
    TenantId: tenantId,
    TenantRoleId: roleId,
    ...overrides,
  });
  await ds.query(
    `INSERT INTO "AccountTenants" ("Id","AccountId","TenantId","TenantRoleId","Status","CreatedAt","UpdatedAt")
     VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
    [data.Id, data.AccountId, data.TenantId, data.TenantRoleId, data.Status],
  );
  return data;
}

async function insertSystemModuleAndResource(ds: DataSource, moduleSlug: string, resourceSlug: string): Promise<{ moduleId: string; resourceId: string }> {
  const mod = systemModuleFactory.build({ Slug: moduleSlug, Name: moduleSlug });
  await ds.query(
    `INSERT INTO "SystemModules" ("Id","Slug","Name","Active","CreatedAt","UpdatedAt")
     VALUES ($1,$2,$3,true,NOW(),NOW())`,
    [mod.Id, mod.Slug, mod.Name],
  );

  const res = systemResourceFactory.build({ ModuleId: mod.Id, Slug: resourceSlug, Name: resourceSlug });
  await ds.query(
    `INSERT INTO "SystemResources" ("Id","ModuleId","Slug","Name","Active","CreatedAt","UpdatedAt")
     VALUES ($1,$2,$3,$4,true,NOW(),NOW())`,
    [res.Id, res.ModuleId, res.Slug, res.Name],
  );
  return { moduleId: mod.Id as string, resourceId: res.Id as string };
}

async function insertPermission(ds: DataSource, moduleId: string, resourceId: string, action: string, name: string) {
  const perm = permissionFactory.build({ ModuleId: moduleId, ResourceId: resourceId, Action: action, Name: name });
  await ds.query(
    `INSERT INTO "Permissions" ("Id","Name","Action","ModuleId","ResourceId","CreatedAt","UpdatedAt")
     VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
    [perm.Id, perm.Name, perm.Action, perm.ModuleId, perm.ResourceId],
  );
  return perm;
}

async function insertRolePermission(
  ds: DataSource,
  roleId: string,
  permissionId: string,
  allowedLevel: number,
  mode: 'allow' | 'deny' = 'allow',
) {
  const data = tenantRolePermissionFactory.build({
    TenantRoleId: roleId,
    PermissionId: permissionId,
    AllowedLevel: allowedLevel,
    Mode: mode,
  });
  await ds.query(
    `INSERT INTO "TenantRolePermissions" ("Id","TenantRoleId","PermissionId","AllowedLevel","Mode","CreatedAt","UpdatedAt")
     VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
    [data.Id, data.TenantRoleId, data.PermissionId, data.AllowedLevel, data.Mode],
  );
  return data;
}

async function insertExtraPermission(
  ds: DataSource,
  accountTenantId: string,
  permissionId: string,
  mode: 'grant' | 'deny',
) {
  await ds.query(
    `INSERT INTO "AccountTenantPermissions" ("Id","AccountTenantId","PermissionId","Mode","CreatedAt","UpdatedAt")
     VALUES (gen_random_uuid(),$1,$2,$3,NOW(),NOW())`,
    [accountTenantId, permissionId, mode],
  );
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('PermissionEvaluatorService (e2e — real DB)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let evaluator: PermissionEvaluatorService;

  beforeAll(async () => {
    const setup = await createIdentityApp();
    app = setup.app;
    ds = setup.dataSource;
    evaluator = app.get(PermissionEvaluatorService);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── evaluate() ──────────────────────────────────────────────────────────

  describe('evaluate()', () => {
    it('nega formato inválido', async () => {
      const res = await evaluator.evaluate('any', 'any', 'invalid');
      expect(res).toEqual({ allowed: false, reason: 'invalid_permission_format' });
    });

    it('nega quando não existe membership', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'sales.order.list');
      expect(res).toEqual({ allowed: false, reason: 'no_membership' });
    });

    it('nega quando membership existe mas não há permissão', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'sales.order.list');
      expect(res).toEqual({ allowed: false, reason: 'no_permission' });
    });

    it('permite quando role tem a permissão com allow', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const { moduleId, resourceId } = await insertSystemModuleAndResource(ds, 'mod1', 'res1');
      const perm = await insertPermission(ds, moduleId, resourceId, 'list', 'mod1.res1.list');
      await insertRolePermission(ds, role.Id!, perm.Id!, 2);

      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'mod1.res1.list');
      expect(res.allowed).toBe(true);
      expect(res.effectiveLevel).toBe(2);
    });

    it('nega quando role tem deny para a permissão', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const { moduleId, resourceId } = await insertSystemModuleAndResource(ds, 'mod2', 'res2');
      const perm = await insertPermission(ds, moduleId, resourceId, 'update', 'mod2.res2.update');
      await insertRolePermission(ds, role.Id!, perm.Id!, 3, 'deny');

      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'mod2.res2.update');
      expect(res).toEqual({ allowed: false, reason: 'role_deny' });
    });

    it('extra deny prevalece sobre role allow', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      const membership = await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const { moduleId, resourceId } = await insertSystemModuleAndResource(ds, 'mod3', 'res3');
      const perm = await insertPermission(ds, moduleId, resourceId, 'create', 'mod3.res3.create');
      await insertRolePermission(ds, role.Id!, perm.Id!, 2);
      await insertExtraPermission(ds, membership.Id!, perm.Id!, 'deny');

      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'mod3.res3.create');
      expect(res).toEqual({ allowed: false, reason: 'extra_deny' });
    });

    it('extra grant permite quando não há role', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const membership = await insertMembership(ds, account.Id!, tenant.Id!, null);

      const { moduleId, resourceId } = await insertSystemModuleAndResource(ds, 'mod4', 'res4');
      const perm = await insertPermission(ds, moduleId, resourceId, 'view', 'mod4.res4.view');
      await insertExtraPermission(ds, membership.Id!, perm.Id!, 'grant');

      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'mod4.res4.view');
      expect(res.allowed).toBe(true);
    });

    // ─── hierarquia ────────────────────────────────────────────────────────

    it('hierarquia: delete (ADMIN) cobre list (VIEW)', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const { moduleId, resourceId } = await insertSystemModuleAndResource(ds, 'h1', 'orders');
      const permDelete = await insertPermission(ds, moduleId, resourceId, 'delete', 'h1.orders.delete');
      const _permList = await insertPermission(ds, moduleId, resourceId, 'list', 'h1.orders.list');
      await insertRolePermission(ds, role.Id!, permDelete.Id!, 4);

      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'h1.orders.list');
      expect(res.allowed).toBe(true);
      expect(res.effectiveLevel).toBe(4);
    });

    it('hierarquia: create (CREATE) não cobre delete (ADMIN)', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const { moduleId, resourceId } = await insertSystemModuleAndResource(ds, 'h2', 'items');
      const permCreate = await insertPermission(ds, moduleId, resourceId, 'create', 'h2.items.create');
      const _permDelete = await insertPermission(ds, moduleId, resourceId, 'delete', 'h2.items.delete');
      await insertRolePermission(ds, role.Id!, permCreate.Id!, 2);

      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'h2.items.delete');
      expect(res).toEqual({ allowed: false, reason: 'no_permission' });
    });

    it('hierarquia não cruza recursos diferentes', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const { moduleId, resourceId: resA } = await insertSystemModuleAndResource(ds, 'h3', 'invoices');
      const permDelete = await insertPermission(ds, moduleId, resA, 'delete', 'h3.invoices.delete');
      await insertRolePermission(ds, role.Id!, permDelete.Id!, 4);

      // Criar outro recurso no mesmo módulo
      const resB = systemResourceFactory.build({ ModuleId: moduleId, Slug: 'payments', Name: 'payments' });
      await ds.query(
        `INSERT INTO "SystemResources" ("Id","ModuleId","Slug","Name","Active","CreatedAt","UpdatedAt")
         VALUES ($1,$2,$3,$4,true,NOW(),NOW())`,
        [resB.Id, resB.ModuleId, resB.Slug, resB.Name],
      );
      await insertPermission(ds, moduleId, resB.Id!, 'list', 'h3.payments.list');

      const res = await evaluator.evaluate(account.Id!, tenant.Id!, 'h3.payments.list');
      expect(res).toEqual({ allowed: false, reason: 'no_permission' });
    });
  });

  // ─── getAccountPermissions() ─────────────────────────────────────────────

  describe('getAccountPermissions()', () => {
    it('retorna null quando account não pertence ao tenant', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const result = await evaluator.getAccountPermissions(account.Id!, tenant.Id!);
      expect(result).toBeNull();
    });

    it('retorna permissões de role + extra grant − extra deny', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      const membership = await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const { moduleId, resourceId } = await insertSystemModuleAndResource(ds, 'gap1', 'widget');
      const permList = await insertPermission(ds, moduleId, resourceId, 'list', 'gap1.widget.list');
      const permCreate = await insertPermission(ds, moduleId, resourceId, 'create', 'gap1.widget.create');
      const permDelete = await insertPermission(ds, moduleId, resourceId, 'delete', 'gap1.widget.delete');

      await insertRolePermission(ds, role.Id!, permList.Id!, 1);
      await insertRolePermission(ds, role.Id!, permCreate.Id!, 2);
      await insertExtraPermission(ds, membership.Id!, permDelete.Id!, 'grant');
      await insertExtraPermission(ds, membership.Id!, permCreate.Id!, 'deny');

      const result = await evaluator.getAccountPermissions(account.Id!, tenant.Id!);
      expect(result).toEqual(expect.arrayContaining(['gap1.widget.list', 'gap1.widget.delete']));
      expect(result).not.toContain('gap1.widget.create');
    });

    it('retorna array vazio quando sem role e sem extras', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      await insertMembership(ds, account.Id!, tenant.Id!, null);

      const result = await evaluator.getAccountPermissions(account.Id!, tenant.Id!);
      expect(result).toEqual([]);
    });
  });

  // ─── getAllTenantsPermissions() ───────────────────────────────────────────

  describe('getAllTenantsPermissions()', () => {
    it('retorna objeto vazio quando account não tem memberships', async () => {
      const account = await insertAccount(ds);
      const result = await evaluator.getAllTenantsPermissions(account.Id!);
      expect(result).toEqual({});
    });

    it('agrupa permissões por tenant corretamente', async () => {
      const account = await insertAccount(ds);
      const tenantA = await insertTenant(ds);
      const tenantB = await insertTenant(ds);
      const roleA = await insertTenantRole(ds, tenantA.Id!);
      const roleB = await insertTenantRole(ds, tenantB.Id!);
      await insertMembership(ds, account.Id!, tenantA.Id!, roleA.Id!);
      await insertMembership(ds, account.Id!, tenantB.Id!, roleB.Id!);

      const { moduleId: mA, resourceId: rA } = await insertSystemModuleAndResource(ds, 'atp1', 'alpha');
      const { moduleId: mB, resourceId: rB } = await insertSystemModuleAndResource(ds, 'atp2', 'beta');
      const permA = await insertPermission(ds, mA, rA, 'list', 'atp1.alpha.list');
      const permB = await insertPermission(ds, mB, rB, 'view', 'atp2.beta.view');
      await insertRolePermission(ds, roleA.Id!, permA.Id!, 1);
      await insertRolePermission(ds, roleB.Id!, permB.Id!, 1);

      const result = await evaluator.getAllTenantsPermissions(account.Id!);
      expect(result[tenantA.Id!]).toEqual(expect.arrayContaining(['atp1.alpha.list']));
      expect(result[tenantB.Id!]).toEqual(expect.arrayContaining(['atp2.beta.view']));
    });

    it('aplica deny e grant extras por tenant', async () => {
      const account = await insertAccount(ds);
      const tenant = await insertTenant(ds);
      const role = await insertTenantRole(ds, tenant.Id!);
      const membership = await insertMembership(ds, account.Id!, tenant.Id!, role.Id!);

      const { moduleId, resourceId } = await insertSystemModuleAndResource(ds, 'atp3', 'gamma');
      const permList = await insertPermission(ds, moduleId, resourceId, 'list', 'atp3.gamma.list');
      const permUpdate = await insertPermission(ds, moduleId, resourceId, 'update', 'atp3.gamma.update');
      const permDelete = await insertPermission(ds, moduleId, resourceId, 'delete', 'atp3.gamma.delete');

      await insertRolePermission(ds, role.Id!, permList.Id!, 1);
      await insertRolePermission(ds, role.Id!, permUpdate.Id!, 3);
      await insertExtraPermission(ds, membership.Id!, permUpdate.Id!, 'deny');
      await insertExtraPermission(ds, membership.Id!, permDelete.Id!, 'grant');

      const result = await evaluator.getAllTenantsPermissions(account.Id!);
      expect(result[tenant.Id!]).toEqual(expect.arrayContaining(['atp3.gamma.list', 'atp3.gamma.delete']));
      expect(result[tenant.Id!]).not.toContain('atp3.gamma.update');
    });
  });
});
