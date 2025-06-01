import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { userGoogleStrategy } from '../guards/googleUser-auth.guard';
import { GoogleProfile } from '../types';
import googleOauthConfig from 'src/config/google.oauth.config';

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
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ) {
    console.log(profile);

    const user = await this.authService.validateGoogleUser({
      email: profile.emails[0].value || profile._json.email,
      primeiroNome: profile.name.givenName || profile._json.given_name,
      segundoNome: profile.name.familyName || profile._json.family_name,
      avatarUrl: profile.photos[0].value || profile._json.picture,
    });
    done(null, user);

    // return user
  }
}
