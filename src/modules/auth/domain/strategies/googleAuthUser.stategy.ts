import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { userGoogleStrategy } from '../guards/googleUser-auth.guard';
import { GoogleProfile } from '../types';
import googleOauthConfig from 'src/config/google.oauth.config';
import { LoggerService } from 'src/common/loggers/domain/logger.service';

@Injectable()
export class GoogleOauthUserStrategy extends PassportStrategy(Strategy, userGoogleStrategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private readonly googleOauthConfiguration: ConfigType<typeof googleOauthConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: googleOauthConfiguration.clientId,
      clientSecret: googleOauthConfiguration.clientSecret,
      callbackURL: googleOauthConfiguration.callbackBackendUser,
      scope: ['email', 'profile'],
    });
  }
  async validate(profile: GoogleProfile) {
    const email = profile.emails?.[0]?.value || profile._json?.email || profile.email;
    const primeiroNome =
      profile.name?.givenName || profile._json?.given_name || profile.displayName?.split(' ')[0];
    const segundoNome = profile.name?.familyName || profile._json?.family_name;
    const avatarUrl = profile.photos?.[0]?.value || profile._json?.picture;

    const user = await this.authService.validateGoogleUser({
      email,
      primeiroNome,
      segundoNome,
      avatarUrl,
    });
    return user;
  }
}
