import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { AccountTenant, AccountTenantStatus } from '../../persistence/entities/accountTenants.entities';

export const accountTenantFactory = Factory.Sync.makeFactory<Partial<AccountTenant>>({
  Id: Factory.each(() => faker.string.uuid()),
  AccountId: Factory.each(() => faker.string.uuid()),
  TenantId: Factory.each(() => faker.string.uuid()),
  TenantRoleId: null,
  Status: 'active' as AccountTenantStatus,
  ExtraPermissions: null,
  Metadata: null,
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
