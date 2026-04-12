import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { TenantRole } from '../../persistence/entities/tenantRoles.entities';

export const tenantRoleFactory = Factory.Sync.makeFactory<Partial<TenantRole>>({
  Id: Factory.each(() => faker.string.uuid()),
  TenantId: Factory.each(() => faker.string.uuid()),
  Name: Factory.each(() => faker.person.jobTitle()),
  Description: Factory.each(() => faker.lorem.sentence()),
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
