import { PermissionGuard } from '../core/guards/permission.guard';
import { Reflector } from '@nestjs/core';

describe('PermissionGuard', () => {
  it('allows when evaluator returns allowed', async () => {
    const reflector = new Reflector();
    const evaluator = { evaluate: jest.fn().mockResolvedValue({ allowed: true }) } as any;

    const guard = new PermissionGuard(reflector, evaluator);

    const handler = () => {};
    reflector['metadataStorage'] = reflector['metadataStorage'] || new Map();

    // set metadata manually via reflector: use Reflector.get by mocking get
    jest.spyOn(reflector, 'get').mockReturnValue('sales.order.view');

    const req: any = { user: { sub: 'acc1', act_tenant: 'tenant1' }, headers: {} };
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => handler,
    };

    const allowed = await guard.canActivate(ctx as any);
    expect(allowed).toBe(true);
    expect(evaluator.evaluate).toHaveBeenCalledWith('acc1', 'tenant1', 'sales.order.view');
  });

  it('denies when no tenant/account info', async () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'get').mockReturnValue('sales.order.view');
    const evaluator = { evaluate: jest.fn() } as any;
    const guard = new PermissionGuard(reflector, evaluator);

    const req: any = { user: null, headers: {}, query: {} };
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => () => {},
    };

    const allowed = await guard.canActivate(ctx as any);
    expect(allowed).toBe(false);
  });
});
