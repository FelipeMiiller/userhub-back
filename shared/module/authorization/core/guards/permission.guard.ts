import { CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorator/permission.decorator';
import { IPermissionEvaluator, PERMISSION_EVALUATOR } from '../services/permission-evaluator.interface';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject(PERMISSION_EVALUATOR) private readonly evaluator: IPermissionEvaluator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionName = this.reflector.get<string>(PERMISSION_KEY, context.getHandler());
    if (!permissionName) return true;

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user?.sub) return false;

    // O tenant ativo é enviado pelo cliente no header X-Tenant-Id em cada request
    const tenantId = request?.headers?.['x-tenant-id'] as string | undefined;
    if (!tenantId) return false;

    // Fast path: tenants + permissões já embutidos no token (sem consulta ao banco)
    if (user.tenants) {
      const tenantPerms: string[] | undefined = user.tenants[tenantId];
      if (!tenantPerms) return false; // account não pertence a este tenant
      return tenantPerms.includes(permissionName);
    }

    // Fallback: avalia via DB (token legado sem claims de permissão)
    if (!this.evaluator) return false;
    const result = await this.evaluator.evaluate(user.sub, tenantId, permissionName);
    return result.allowed;
  }
}
