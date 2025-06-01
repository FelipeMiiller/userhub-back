import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { AuthService } from '../auth.service';
import { Payload } from '../types';
import { refreshStrategy } from '../guards/refresh-auth.guard';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, refreshStrategy) {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh'),
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
