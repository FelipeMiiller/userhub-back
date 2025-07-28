import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from 'shared/modules/loggers';
import jwtConfig from 'shared/modules/authorization/config/jwt.config';
import { Payload } from '../types';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = AuthorizationService.name;
  }

  async verifyToken(token: string): Promise<Payload> {
    if (!this.jwtConfiguration.signOptions?.algorithm || !this.jwtConfiguration.secret) {
      throw new Error('JWT algorithm or secret is not defined in configuration.');
    }
    return this.jwtService.verifyAsync(token, {
      secret: this.jwtConfiguration.secret,
      algorithms: [this.jwtConfiguration.signOptions.algorithm],
    });
  }
}
