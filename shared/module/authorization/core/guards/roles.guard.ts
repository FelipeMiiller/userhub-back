import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RolesGuards } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get(RolesGuards, context.getHandler());
    const token = context.switchToHttp().getRequest().header('Authorization');

    if (!roles) return true;
    if (!token) return false;
    const userDecode = this.jwtService.decode(token.split(' ')[1]);

    if (userDecode && roles.includes(userDecode.role)) {
      return true;
    }
    return false;
  }
}
