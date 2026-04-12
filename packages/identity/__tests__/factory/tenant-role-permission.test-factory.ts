import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { TenantRolePermission, PermissionMode } from '../../persistence/entities/tenantRolePermissions.entities';

export const tenantRolePermissionFactory = Factory.Sync.makeFactory<Partial<TenantRolePermission>>({
  Id: Factory.each(() => faker.string.uuid()),
  TenantRoleId: Factory.each(() => faker.string.uuid()),
  PermissionId: Factory.each(() => faker.string.uuid()),
  AllowedLevel: Factory.each(() => faker.number.int({ min: 1, max: 5 })),
  Mode: 'allow' as PermissionMode,
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
