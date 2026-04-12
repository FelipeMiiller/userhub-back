import { Global, Module } from '@nestjs/common';
import { IdentityPersistenceModule } from './persistence/persistence.module';
import { IdentityIntegrationModule } from './integration/identity.integration';
import { IdentityTestIntegrationModule } from './integration/identity-test.integration';
import { AuthorizationModule, PERMISSION_EVALUATOR } from '@hub/shared-module/authorization';
import { SharedCacheRedisModule } from '@hub/shared-module/cache';
import { LoggerModule } from '@hub/shared-module/loggers';
import { ConfigModule } from '@nestjs/config';
import refreshJwtConfig from './config/refresh-jwt.config';
import googleOauthConfig from './config/google.oauth.config';
import { AuthentificationController } from './authentication/http/authentification.controller';
import { AuthenticationService } from './authentication/core/services/auth.service';
import { LocalUserStrategy } from './authentication/core/strategies/local_user.strategy';
import { GoogleOauthUserStrategy } from './authentication/core/strategies/googleAuthUser.strategy';
import { JwtStrategy } from './authentication/core/strategies/jwt.strategy';
import { AccountService } from './authentication/core/services/account.service';
import { RefreshStrategy } from './authentication/core/strategies/refresh.strategy';
import { PermissionService } from './core/services/permission.service';
import { PermissionEvaluatorService } from './core/services/permission-evaluator.service';
import { PermissionGuard } from './core/guards/permission.guard';
import { Reflector } from '@nestjs/core';
import jwtConfig from '@hub/shared-module/authorization/config/jwt.config';
import { TenantService } from './tenant/core/services/tenant.service';
import { AccountTenantService } from './tenant/core/services/account-tenant.service';
import { SystemModuleService } from './tenant/core/services/system-module.service';
import { SystemResourceService } from './tenant/core/services/system-resource.service';
import { TenantRoleService } from './tenant/core/services/tenant-role.service';
import { PermissionCatalogService } from './tenant/core/services/permission-catalog.service';
import { SystemModuleController } from './tenant/http/rest/system-module.controller';
import { SystemResourceController } from './tenant/http/rest/system-resource.controller';
import { TenantRoleController } from './tenant/http/rest/tenant-role.controller';
import { PermissionCatalogController } from './tenant/http/rest/permission-catalog.controller';
import { AccountTenantController } from './tenant/http/rest/account-tenant.controller';
import { TenantController } from './tenant/http/rest/tenant.controller';


@Global()
@Module({
  imports: [
    AuthorizationModule,
    SharedCacheRedisModule,
    LoggerModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ...(process.env.NODE_ENV !== 'test' ? [ConfigModule.forFeature(googleOauthConfig)] : []),
    IdentityPersistenceModule,
    ...(process.env.NODE_ENV !== 'test'
      ? [IdentityIntegrationModule]
      : [IdentityTestIntegrationModule]
    ),

  ],
  controllers: [
    AuthentificationController,

    SystemModuleController,
    SystemResourceController,
    TenantRoleController,
    PermissionCatalogController,
    AccountTenantController,
    TenantController,
  ],
  providers: [
    AccountService,
    TenantService,
    AccountTenantService,
    SystemModuleService,
    SystemResourceService,
    TenantRoleService,
    PermissionCatalogService,
    AuthenticationService,
    LocalUserStrategy,
    ...(process.env.NODE_ENV !== 'test' ? [GoogleOauthUserStrategy] : []),
    JwtStrategy,
    RefreshStrategy,
    PermissionService,
    PermissionEvaluatorService,
    { provide: PERMISSION_EVALUATOR, useExisting: PermissionEvaluatorService },
    PermissionGuard,
    Reflector,
  ],
  exports: [
    AccountService,
    TenantService,
    AccountTenantService,
    AuthorizationModule,
    PermissionService,
    PermissionEvaluatorService,
  ],
})
export class IdentityModule {}
