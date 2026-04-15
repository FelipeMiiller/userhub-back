import { Global, Module } from '@nestjs/common';
import { IdentityPersistenceModule } from './persistence/persistence.module';
import { IdentityIntegrationModule } from './integration/identity.integration';
import { IdentityTestIntegrationModule } from './integration/identity-test.integration';
import { CatalogModule } from './catalog/catalog.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { TenantFeatureModule } from './tenant/tenant.module';
import { AuthorizationModule, PERMISSION_EVALUATOR } from '@hub/shared-module/authorization';
import { SharedCacheRedisModule } from '@hub/shared-module/cache';
import { LoggerModule } from '@hub/shared-module/loggers';
import { PermissionService } from './core/services/permission.service';
import { PermissionEvaluatorService } from './core/services/permission-evaluator.service';
import { PermissionGuard } from './core/guards/permission.guard';
import { Reflector } from '@nestjs/core';

@Global()
@Module({
  imports: [
    AuthorizationModule,
    SharedCacheRedisModule,
    LoggerModule,
    IdentityPersistenceModule,
    CatalogModule,
    AuthenticationModule,
    TenantFeatureModule,
    ...(process.env.NODE_ENV !== 'test'
      ? [IdentityIntegrationModule]
      : [IdentityTestIntegrationModule]),
  ],
  providers: [
    PermissionService,
    PermissionEvaluatorService,
    { provide: PERMISSION_EVALUATOR, useExisting: PermissionEvaluatorService },
    PermissionGuard,
    Reflector,
  ],
  exports: [
    AuthenticationModule,
    TenantFeatureModule,
    AuthorizationModule,
    PermissionService,
    PermissionEvaluatorService,
  ],
})
export class IdentityModule {}
