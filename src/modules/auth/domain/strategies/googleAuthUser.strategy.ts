import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
    try {
      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else if (profile._json && profile._json.email) {
        email = profile._json.email;
      } else if (profile.email) {
        email = profile.email;
      }

      if (!email) {
        return done(new UnauthorizedException('Email do Google profile é obrigatório'), null);
      }

      const primeiroNome =
        profile.name?.givenName ||
        profile._json?.given_name ||
        profile.displayName?.split(' ')[0] ||
        'Usuário';
      const segundoNome = profile.name?.familyName || profile._json?.family_name || '';
      const avatarUrl = profile.photos?.[0]?.value || profile._json?.picture || null;

      const user = await this.authService.validateGoogleUser({
        email,
        primeiroNome,
        segundoNome,
        avatarUrl,
      });

      return done(null, user);
    } catch (error) {
      console.error('Erro na validação do Google OAuth:');
      return done(error, null);
    }
  }
}
