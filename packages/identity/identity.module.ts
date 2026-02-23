import { Global, Module } from '@nestjs/common';

import { IdentityIntegrationModule } from './integration/identity.integration';
import { IdentityScheduleModule } from './schedules/schedule.module';
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
import { PermissionService } from './core/services/permission.service';
import { PermissionEvaluatorService } from './core/services/permission-evaluator.service';
import { PermissionGuard } from './core/guards/permission.guard';
import { Reflector } from '@nestjs/core';
import { AuthorizationModule } from '@hub/shared-module/authorization';
import jwtConfig, { } from '@hub/shared-module/authorization/config/jwt.config';
import { IdentityPersistenceModule } from './persistence/persistence.module';

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
    PermissionService,
    PermissionEvaluatorService,
    PermissionGuard,
    Reflector,
  ],
  exports: [UsersService, AuthorizationModule, PermissionService, PermissionEvaluatorService],
})
export class IdentityModule { }
