import { TypeOrmModule } from '@nestjs/typeorm';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeormConfig, { TypeormConfig } from '../config/typeorm.config';
import { AccountRepository } from './repository/account.typeorm.repository';
import { ProfileRepository } from './repository/profile.typeorm.repository';
import { TenantRepository } from './repository/tenant.typeorm.repository';
import { AccountTenantRepository } from './repository/account-tenant.typeorm.repository';
import { SystemModuleRepository } from './repository/system-module.typeorm.repository';
import { SystemResourceRepository } from './repository/system-resource.typeorm.repository';
import { TenantRoleRepository } from './repository/tenant-role.typeorm.repository';
import { PermissionRepository } from './repository/permission.typeorm.repository';
import { TenantRolePermissionRepository } from './repository/tenant-role-permission.typeorm.repository';
import { TenantModuleRepository } from './repository/tenant-module.typeorm.repository';
import { AccountTenantPermissionRepository } from './repository/account-tenant-permission.typeorm.repository';
import { AddressRepository } from './repository/address.typeorm.repository';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(typeormConfig),
    TypeOrmModule.forRootAsync({
      name: 'identity',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm') as TypeormConfig,
    }),
  ],
  providers: [
    AccountRepository,
    ProfileRepository,
    TenantRepository,
    AccountTenantRepository,
    SystemModuleRepository,
    SystemResourceRepository,
    TenantRoleRepository,
    PermissionRepository,
    TenantRolePermissionRepository,
    TenantModuleRepository,
    AccountTenantPermissionRepository,
    AddressRepository,
  ],
  exports: [
    AccountRepository,
    ProfileRepository,
    TenantRepository,
    AccountTenantRepository,
    SystemModuleRepository,
    SystemResourceRepository,
    TenantRoleRepository,
    PermissionRepository,
    TenantRolePermissionRepository,
    TenantModuleRepository,
    AccountTenantPermissionRepository,
    AddressRepository,
  ],
})
export class IdentityPersistenceModule {}
