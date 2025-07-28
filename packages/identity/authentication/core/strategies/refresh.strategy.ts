import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { refreshStrategyPassport } from '../guards/refresh-auth.guard';
import refreshJwtConfig from 'identity/config/refresh-jwt.config';
import { Payload } from 'shared/modules/authorization';
import { AuthenticationService } from '../services/auth.service';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, refreshStrategyPassport) {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
    private authService: AuthenticationService,
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
