import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Payload } from '../types';

/**
 * TenantContextGuard
 *
 * Garante que o account autenticado é membro do tenant referenciado na URL.
 * Deve ser usado APÓS o JwtAuthGuard em todas as rotas com `:tenantId` ou `:id`
 * que representem um tenant.
 *
 * Extração do tenant ID na URL (por prioridade):
 *   1. params.tenantId  — rotas como /tenants/:tenantId/roles
 *   2. params.id        — rotas como /tenants/:id
 *
 * Valida contra o mapa `user.tenants` embutido no token JWT.
 * Se o account não for membro → ForbiddenException (403).
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: Payload;
      params?: Record<string, string>;
    }>();

    const tenantId: string | undefined = request.params?.['tenantId'] ?? request.params?.['id'];

    if (!tenantId) {
      // Rota sem parâmetro de tenant — este guard não se aplica
      return true;
    }

    const user = request.user;
    if (!user?.sub) {
      throw new ForbiddenException('Acesso negado: usuário não autenticado');
    }

    if (!user.tenants || !(tenantId in user.tenants)) {
      throw new ForbiddenException(`Acesso negado: account não é membro do tenant '${tenantId}'`);
    }

    return true;
  }
}
