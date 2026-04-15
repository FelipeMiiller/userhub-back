import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { Account } from '../persistence/entities/accounts.entities';
import { Profile } from '../persistence/entities/profiles.entities';
import { Address } from '../persistence/entities/addresses.entities';
import { Tenant } from '../persistence/entities/tenants.entities';
import { AccountTenant } from '../persistence/entities/accountTenants.entities';
import { TenantRole } from '../persistence/entities/tenantRoles.entities';
import { Permission } from '../persistence/entities/permissions.entities';
import { TenantRolePermission } from '../persistence/entities/tenantRolePermissions.entities';
import { SystemModule } from '../persistence/entities/modules.entities';
import { SystemResource } from '../persistence/entities/resources.entities';
import { TenantModule } from '../persistence/entities/tenantModules.entities';
import { AccountTenantPermission } from '../persistence/entities/accountTenantPermissions.entities';
import { Migration1776300000000 } from '../persistence/migrations/1776300000000-Migration';
import { configValidator } from '@hub/shared-module/config';

class EnvironmentVariablesValidator {
  @IsString()
  TYPEORM_HOST: string;

  @IsString()
  TYPEORM_USERNAME: string;

  @IsString()
  TYPEORM_PASSWORD: string;

  @IsString()
  TYPEORM_DATABASE: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  TYPEORM_PORT: number;

  @IsBoolean()
  @IsOptional()
  TYPEORM_SSL: boolean;
}

export type TypeormConfig = DataSourceOptions;

export default registerAs('typeorm', (): TypeormConfig => {
  configValidator(process.env, EnvironmentVariablesValidator);
  return {
    name: 'identity',
    type: 'postgres',
    host: process.env.TYPEORM_HOST,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    port: parseInt(process.env.TYPEORM_PORT as string, 10) || 5432,
    entities: [
      Account,
      Profile,
      Address,
      Tenant,
      AccountTenant,
      TenantRole,
      Permission,
      TenantRolePermission,
      SystemModule,
      SystemResource,
      TenantModule,
      AccountTenantPermission,
    ],
    migrations: [Migration1776300000000],
    migrationsTableName: 'identity_migrations',
    synchronize: false,
    logging: process.env.NODE_ENV !== 'test',
    migrationsRun: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
    ssl: process.env.TYPEORM_SSL === 'true',
  };
});
