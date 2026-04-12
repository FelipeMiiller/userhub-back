import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuards } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>(RolesGuards, context.getHandler());
    if (!roles || roles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request['user'];
    if (!user) return false;

    // No novo modelo não há campo 'role' no token.
    // RolesGuard é mantido por compatibilidade; use @Permission() + PermissionGuard no lugar.
    return false;
  }
}
