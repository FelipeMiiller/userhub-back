import { PermissionEvaluatorService } from '../services/permission-evaluator.service';
import { PermissionService } from '../services/permission.service';
import { DataSource } from 'typeorm';

const makeDataSourceMock = (
  queryImpl: (sql: string, params?: unknown[]) => Promise<unknown[]>,
) => ({
  query: queryImpl,
});

describe('PermissionEvaluatorService (Avaliação de Permissão)', () => {
  it('permite quando o papel fornece AllowedLevel suficiente', async () => {
    const ds = makeDataSourceMock(async (sql) => {
      if (sql.includes('FROM "AccountTenants"')) {
        return [{ Id: 'at1', TenantRoleId: 'role1' }];
      }
      if (sql.includes('FROM "AccountTenantPermissions"')) {
        return [];
      }
      return [{ TenantRoleId: 'role1', AllowedLevel: 2, Mode: 'allow' }];
    }) as unknown as DataSource;

    const evaluator = new PermissionEvaluatorService(ds, new PermissionService());
    const res = await evaluator.evaluate('acc1', 'tenant1', 'sales.order.update');

    expect(res.allowed).toBe(true);
    expect(res.effectiveLevel).toBe(2);
  });

  it('nega quando o papel está em modo deny', async () => {
    const ds = makeDataSourceMock(async (sql) => {
      if (sql.includes('FROM "AccountTenants"')) {
        return [{ Id: 'at1', TenantRoleId: 'role1' }];
      }
      if (sql.includes('FROM "AccountTenantPermissions"')) {
        return [];
      }
      return [{ TenantRoleId: 'role1', AllowedLevel: 2, Mode: 'deny' }];
    }) as unknown as DataSource;

    const evaluator = new PermissionEvaluatorService(ds, new PermissionService());
    const res = await evaluator.evaluate('acc1', 'tenant1', 'sales.order.update');

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('role_deny');
  });

  it('nega quando não existe vínculo', async () => {
    const ds = makeDataSourceMock(async () => []) as unknown as DataSource;

    const evaluator = new PermissionEvaluatorService(ds, new PermissionService());
    const res = await evaluator.evaluate('acc1', 'tenant1', 'sales.order.update');

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('no_membership');
  });

  it('nega quando não há permissão de papel nem grant extra', async () => {
    const ds = makeDataSourceMock(async (sql) => {
      if (sql.includes('FROM "AccountTenants"')) {
        return [{ Id: 'at1', TenantRoleId: 'role1' }];
      }
      if (sql.includes('FROM "AccountTenantPermissions"')) {
        return [];
      }
      return [];
    }) as unknown as DataSource;

    const evaluator = new PermissionEvaluatorService(ds, new PermissionService());
    const res = await evaluator.evaluate('acc1', 'tenant1', 'sales.order.update');

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('no_permission');
  });

  it('permite quando AccountTenantPermissions tem Mode=grant para a permissão', async () => {
    const ds = makeDataSourceMock(async (sql) => {
      if (sql.includes('FROM "AccountTenants"')) {
        return [{ Id: 'at1', TenantRoleId: null }];
      }
      if (sql.includes('FROM "AccountTenantPermissions"')) {
        return [{ Name: 'sales.order.update', Mode: 'grant' }];
      }
      return [];
    }) as unknown as DataSource;

    const evaluator = new PermissionEvaluatorService(ds, new PermissionService());
    const res = await evaluator.evaluate('acc1', 'tenant1', 'sales.order.update');

    expect(res.allowed).toBe(true);
  });

  it('nega quando AccountTenantPermissions tem Mode=deny mesmo se o papel permitir', async () => {
    const ds = makeDataSourceMock(async (sql) => {
      if (sql.includes('FROM "AccountTenants"')) {
        return [{ Id: 'at1', TenantRoleId: 'role1' }];
      }
      if (sql.includes('FROM "AccountTenantPermissions"')) {
        return [{ Name: 'sales.order.update', Mode: 'deny' }];
      }
      return [{ TenantRoleId: 'role1', AllowedLevel: 2, Mode: 'allow' }];
    }) as unknown as DataSource;

    const evaluator = new PermissionEvaluatorService(ds, new PermissionService());
    const res = await evaluator.evaluate('acc1', 'tenant1', 'sales.order.update');

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('extra_deny');
  });
});
