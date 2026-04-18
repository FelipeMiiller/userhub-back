import { PermissionGuard } from '../guards/permission.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionEvaluatorService } from '../services/permission-evaluator.service';
import { accountFactory } from '../../__tests__/factory/account.test-factory';
import { tenantFactory } from '../../__tests__/factory/tenant.test-factory';

describe('PermissionGuard (Guarda de Permissão)', () => {
  it('permite quando o avaliador retorna allowed', async () => {
    const reflector = new Reflector();
    const evaluator = {
      evaluate: jest.fn().mockResolvedValue({ allowed: true }),
    } as unknown as PermissionEvaluatorService;

    const guard = new PermissionGuard(reflector, evaluator);

    const handler = jest.fn();
    jest.spyOn(reflector, 'get').mockReturnValue('sales.order.view');

    const account = accountFactory.build();
    const tenant = tenantFactory.build();
    const req = {
      user: { sub: account.Id },
      headers: { 'x-tenant-id': tenant.Id },
    } as unknown as Request;
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => handler,
    } as unknown as ExecutionContext;

    const allowed = await guard.canActivate(ctx as any);
    expect(allowed).toBe(true);
    expect(evaluator.evaluate).toHaveBeenCalledWith(account.Id, tenant.Id, 'sales.order.view');
  });

  it('nega quando não há info de tenant/conta', async () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'get').mockReturnValue('sales.order.view');
    const evaluator = { evaluate: jest.fn() } as unknown as PermissionEvaluatorService;
    const guard = new PermissionGuard(reflector, evaluator);

    const req = { user: null, headers: {}, query: {} } as unknown as Request;
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => jest.fn(),
    } as unknown as ExecutionContext;

    const allowed = await guard.canActivate(ctx as any);
    expect(allowed).toBe(false);
  });
});
