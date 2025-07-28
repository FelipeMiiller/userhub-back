import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthenticationService } from '../services/auth.service';
import { userLocalStrategyPassport } from '../guards/localUser-auth.guard';

@Injectable()
export class LocalUserStrategy extends PassportStrategy(Strategy, userLocalStrategyPassport) {
  constructor(private authService: AuthenticationService) {
    super({
      usernameField: 'Email',
      passwordField: 'Password',
    });
  }

  async validate(Email: string, Password: string) {
    return this.authService.validateUser(Email, Password);
  }
}
