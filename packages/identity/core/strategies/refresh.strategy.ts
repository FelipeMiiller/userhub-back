import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Payload } from '../types';
import { refreshStrategy } from '../guards/refresh-auth.guard';
import { AuthService } from '../services/auth.service';
import refreshJwtConfig from 'packages/identity/config/refresh-jwt.config';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, refreshStrategy) {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: refreshTokenConfig.secret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: Payload) {
    const refreshToken = req.body.refreshToken;
    return this.authService.validateRefreshToken(payload.sub, refreshToken);
  }
}
