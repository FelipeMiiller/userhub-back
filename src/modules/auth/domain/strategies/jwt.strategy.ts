import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import jwtConfig from 'src/config/jwt.config';
import { AuthService } from '../auth.service';
import { Payload } from '../types';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfiguration.secret,
      ignoreExpiration: false,
      algorithms: [jwtConfiguration.signOptions.algorithm],
    });
  }

  async validate(payload: Payload): Promise<Payload> {
    return this.authService.validateJwt(payload);
  }
}
