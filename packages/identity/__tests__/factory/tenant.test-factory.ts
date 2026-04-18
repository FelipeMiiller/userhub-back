import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { Tenant, TenantStatus } from '../../persistence/entities/tenants.entities';

export const tenantFactory = Factory.Sync.makeFactory<Partial<Tenant>>({
  Id: Factory.each(() => faker.string.uuid()),
  Name: Factory.each(() => faker.company.name()),
  Slug: Factory.each(() => faker.lorem.slug(2)),
  Status: 'active' as TenantStatus,
  Metadata: null,
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
