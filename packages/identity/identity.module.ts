import { Global, Module } from '@nestjs/common';

import { IdentityPersistenceModule } from './shared/persistence/persistence.module';
import { IdentityIntegrationModule } from './integration/identity.integration';
import { IdentityScheduleModule } from './schedules/schedule.module';

import { AuthorizationModule } from 'shared/modules/authorization';
import { ConfigModule } from '@nestjs/config';
import refreshJwtConfig from './config/refresh-jwt.config';
import googleOauthConfig from './config/google.oauth.config';
import { AuthentificationController } from './authentication/http/authentification.controller';
import { UsersController } from './account/http/rest/users.controller';
import { AuthenticationService } from './authentication/core/services/auth.service';
import { LocalUserStrategy } from './authentication/core/strategies/local_user.strategy';
import { GoogleOauthUserStrategy } from './authentication/core/strategies/googleAuthUser.strategy';
import { JwtStrategy } from './authentication/core/strategies/jwt.strategy';
import { UsersService } from './account/core/services/users.service';
import { RefreshStrategy } from './authentication/core/strategies/refresh.strategy';
import jwtConfig from 'shared/modules/authorization/config/jwt.config';

@Global()
@Module({
  imports: [
    AuthorizationModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ConfigModule.forFeature(googleOauthConfig),
    IdentityPersistenceModule,
    IdentityIntegrationModule,
    ...(process.env.NODE_ENV !== 'test' ? [IdentityScheduleModule] : []),
  ],
  controllers: [AuthentificationController, UsersController],
  providers: [
    UsersService,
    AuthenticationService,
    LocalUserStrategy,
    GoogleOauthUserStrategy,
    JwtStrategy,
    RefreshStrategy,
  ],
  exports: [UsersService, AuthorizationModule],
})
export class IdentityModule {}
