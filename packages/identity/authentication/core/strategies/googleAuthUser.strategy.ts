import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from 'packages/identity/config/google.oauth.config';
import { AuthenticationService } from '../services/auth.service';
import { userGoogleStrategyPassport } from '../guards/googleUser-auth.guard';

@Injectable()
export class GoogleOauthUserStrategy extends PassportStrategy(
  Strategy,
  userGoogleStrategyPassport,
) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private readonly googleOauthConfiguration: ConfigType<typeof googleOauthConfig>,
    private readonly authService: AuthenticationService,
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
    profile: Profile,
    done: VerifyCallback,
  ) {
    try {
      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else if (profile._json && profile._json.email) {
        email = profile._json.email;
      }

      if (!email) {
        return done(new UnauthorizedException('Email do Google profile é obrigatório'), null);
      }

      const firstName =
        profile.name?.givenName ||
        profile._json?.given_name ||
        profile.displayName?.split(' ')[0] ||
        'Usuário';
      const lastName = profile.name?.familyName || profile._json?.family_name || '';
      const photo = profile.photos?.[0]?.value || profile._json?.picture || null;

      const user = await this.authService.validateGoogleUser({
        email,
        firstName,
        lastName,
        photo,
      });

      return done(null, user);
    } catch (error) {
      console.error('Erro na validação do Google OAuth:');
      return done(error, null);
    }
  }
}
