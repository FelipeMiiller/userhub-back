import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Payload } from '../types';
import jwtConfig from '../../config/jwt.config';
import { LoggerService } from '@hub/shared-module/loggers';
import { TokenDenylistService } from './token-denylist.service';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly loggerService: LoggerService,
    private readonly tokenDenylistService: TokenDenylistService,
  ) {
    this.loggerService.contextName = AuthorizationService.name;
  }

  async verifyToken(token: string): Promise<Payload> {
    if (!this.jwtConfiguration.signOptions?.algorithm || !this.jwtConfiguration.secret) {
      throw new Error('JWT algorithm or secret is not defined in configuration.');
    }
    return this.jwtService.verifyAsync(token, {
      secret: this.jwtConfiguration.secret as string,
      algorithms: [this.jwtConfiguration.signOptions.algorithm],
    });
  }

  /**
   * Revoga um token adicionando seu jti à denylist no Redis.
   * O TTL da entrada é calculado a partir do campo `exp` do token.
   * Chamado pelo logout para invalidar o access token imediatamente.
   *
   * @param token - Access token JWT a ser revogado
   */
  async revokeToken(token: string): Promise<void> {
    const payload = this.jwtService.decode(token) as Payload & { exp?: number };
    if (!payload?.jti || !payload?.exp) return;
    const ttlSeconds = payload.exp - Math.floor(Date.now() / 1000);
    await this.tokenDenylistService.revoke(payload.jti, ttlSeconds);
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    return this.tokenDenylistService.isRevoked(jti);
  }
}
