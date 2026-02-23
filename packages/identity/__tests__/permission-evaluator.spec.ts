import { PermissionEvaluatorService } from '../core/services/permission-evaluator.service';
import { PermissionService } from '../core/services/permission.service';

const makeDataSourceMock = (queryImpl: (sql: string, params?: any[]) => Promise<any[]>) => ({
  query: queryImpl,
});

describe('PermissionEvaluatorService', () => {
  it('allows when role provides sufficient AllowedLevel', async () => {
    // memberships query returns one membership with TenantRoleId 'role1'
    const ds = makeDataSourceMock(async (sql, params) => {
      if (sql.includes('FROM "UserTenants"')) {
        return [{ TenantRoleId: 'role1', Metadata: {} }];
      }
      // rows for TenantRolePermissions join
      return [
        {
          TenantRoleId: 'role1',
          AllowedLevel: 2,
          Mode: 'allow',
          PermissionName: 'sales.order.update',
          Modules: ['sales'],
        },
      ];
    }) as any;

    const permissionService = new PermissionService();
    const evaluator = new PermissionEvaluatorService(ds as any, permissionService as any);

    const res = await evaluator.evaluate('acc1', 'tenant1', 'sales.order.update');
    expect(res.allowed).toBe(true);
    expect(res.effectiveLevel).toBe(2);
  });

  it('denies when a deny is present', async () => {
    const ds = makeDataSourceMock(async (sql, params) => {
      if (sql.includes('FROM "UserTenants"')) {
        return [{ TenantRoleId: 'role1', Metadata: {} }];
      }
      return [
        {
          TenantRoleId: 'role1',
          AllowedLevel: 2,
          Mode: 'deny',
          PermissionName: 'sales.order.update',
          Modules: ['sales'],
        },
      ];
    }) as any;

    const permissionService = new PermissionService();
    const evaluator = new PermissionEvaluatorService(ds as any, permissionService as any);

    const res = await evaluator.evaluate('acc1', 'tenant1', 'sales.order.update');
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('role_deny');
  });
});
