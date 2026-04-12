import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { Permission } from '../../persistence/entities/permissions.entities';

export const permissionFactory = Factory.Sync.makeFactory<Partial<Permission>>({
  Id: Factory.each(() => faker.string.uuid()),
  Name: Factory.each(() => faker.lorem.slug()),
  ModuleId: Factory.each(() => faker.string.uuid()),
  ResourceId: Factory.each(() => faker.string.uuid()),
  Action: Factory.each(() => faker.helpers.arrayElement(['read', 'write', 'update', 'delete'])),
  Description: Factory.each(() => faker.lorem.sentence()),
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
