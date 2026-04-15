import { Module } from '@nestjs/common';
import { TenantService } from './core/services/tenant.service';
import { AccountTenantService } from './core/services/account-tenant.service';
import { TenantRoleService } from './core/services/tenant-role.service';
import { PermissionCatalogService } from './core/services/permission-catalog.service';
import { TenantModuleService } from './core/services/tenant-module.service';
import { TenantController } from './http/rest/tenant.controller';
import { AccountTenantController } from './http/rest/account-tenant.controller';
import { TenantRoleController } from './http/rest/tenant-role.controller';
import { PermissionCatalogController } from './http/rest/permission-catalog.controller';
import { TenantModuleController } from './http/rest/tenant-module.controller';
import { TenantMemberAddressController } from './http/rest/tenant-member-address.controller';
import { AddressService } from '../authentication/core/services/address.service';

/**
 * TenantModule — gestão de tenants, memberships, roles e permissões.
 *
 * Responsabilidades:
 *  - CRUD de tenants e memberships (AccountTenant)
 *  - Roles por tenant e mapeamento role → permissão
 *  - Módulos habilitados por tenant (TenantModules)
 *  - CRUD de endereços de membros no escopo do tenant (admin)
 *
 * Depende do IdentityPersistenceModule (global) para os repositórios.
 */
@Module({
  controllers: [
    TenantController,
    AccountTenantController,
    TenantRoleController,
    PermissionCatalogController,
    TenantModuleController,
    TenantMemberAddressController,
  ],
  providers: [
    TenantService,
    AccountTenantService,
    TenantRoleService,
    PermissionCatalogService,
    TenantModuleService,
    AddressService,
  ],
  exports: [TenantService, AccountTenantService],
})
export class TenantFeatureModule {}
