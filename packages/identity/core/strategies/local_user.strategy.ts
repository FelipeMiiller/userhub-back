import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { userLocalStrategy } from '../guards/localUser-auth.guard';

@Injectable()
export class LocalUserStrategy extends PassportStrategy(Strategy, userLocalStrategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'Email',
      passwordField: 'Password',
    });
  }

  async validate(Email: string, Password: string) {
    return this.authService.validateUser(Email, Password);
  }
}
