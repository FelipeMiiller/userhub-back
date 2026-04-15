import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationService } from './core/services/auth.service';
import { AccountService } from './core/services/account.service';
import { AddressService } from './core/services/address.service';
import { LocalUserStrategy } from './core/strategies/local_user.strategy';
import { GoogleOauthUserStrategy } from './core/strategies/googleAuthUser.strategy';
import { JwtStrategy } from './core/strategies/jwt.strategy';
import { RefreshStrategy } from './core/strategies/refresh.strategy';
import { AuthentificationController } from './http/authentification.controller';
import { MeController } from './http/me.controller';
import refreshJwtConfig from '../config/refresh-jwt.config';
import googleOauthConfig from '../config/google.oauth.config';
import jwtConfig from '@hub/shared-module/authorization/config/jwt.config';

/**
 * AuthenticationModule — autenticação e self-service do account autenticado.
 *
 * Responsabilidades:
 *  - Signup, signin, signout, refresh token
 *  - OAuth Google
 *  - Recuperação e troca de senha, verificação de e-mail
 *  - Self-service do account: perfil e endereços (/auth/me/*)
 *
 * Depende do IdentityPersistenceModule (global) para os repositórios.
 */
@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ...(process.env.NODE_ENV !== 'test' ? [ConfigModule.forFeature(googleOauthConfig)] : []),
  ],
  controllers: [AuthentificationController, MeController],
  providers: [
    AuthenticationService,
    AccountService,
    AddressService,
    LocalUserStrategy,
    ...(process.env.NODE_ENV !== 'test' ? [GoogleOauthUserStrategy] : []),
    JwtStrategy,
    RefreshStrategy,
  ],
  exports: [AccountService, AddressService],
})
export class AuthenticationModule {}
