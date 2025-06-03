import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/modules/auth/domain/decorator/public.decorator';
import { AuthService } from '../auth.service';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'; // Importar tipos de erro

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    console.log(
      `[JwtAuthGuard] canActivate triggered for path: ${context.switchToHttp().getRequest().path}, method: ${context.switchToHttp().getRequest().method}`,
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    try {
      const payload = await this.authService.verifyToken(token);
      request['user'] = payload;
      if (!payload.status) {
        // Este erro específico é importante para distinguir de falhas de token.
        throw new UnauthorizedException('User inactive');
      }
    } catch (error) {
      // Log detalhado da falha de autenticação.
      console.error(
        `[JwtAuthGuard] Authentication failed for path: ${request.path}. Token: ${token ? token.substring(0, 30) + '...' : 'N/A'}. Original error: ${error.message}`,
        {
          errorName: error.name,
          errorMessage: error.message,
          // errorStack: error.stack, // Opcional: pode ser muito verboso para logs de rotina
        },
      );
      // Lança uma exceção genérica para o cliente, ocultando detalhes internos.
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    console.log('[JwtAuthGuard.extractTokenFromHeader] Raw Authorization Header:', authHeader);
    const [type, tokenValue] = authHeader?.split(' ') ?? [];
    console.log(
      '[JwtAuthGuard.extractTokenFromHeader] Parsed type:',
      type,
      'Parsed tokenValue:',
      tokenValue,
    );
    return type === 'bearer' ? tokenValue : undefined;
  }
}
