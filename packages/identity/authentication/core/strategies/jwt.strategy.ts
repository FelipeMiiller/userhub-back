import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '@hub/shared-module/authorization/config/jwt.config';
import { Payload } from '@hub/shared-module/authorization';
import { AuthenticationService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private authService: AuthenticationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfiguration.secret as string,
      ignoreExpiration: false,
      algorithms: [jwtConfiguration.signOptions?.algorithm].filter(
        (a): a is NonNullable<typeof a> => !!a,
      ),
    });
  }

  async validate(payload: Payload): Promise<Payload> {
    return this.authService.validateJwt(payload);
  }
}
