import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { SystemResource } from '../../persistence/entities/resources.entities';

export const systemResourceFactory = Factory.Sync.makeFactory<Partial<SystemResource>>({
  Id: Factory.each(() => faker.string.uuid()),
  ModuleId: Factory.each(() => faker.string.uuid()),
  Slug: Factory.each(() => faker.lorem.slug()),
  Name: Factory.each(() => faker.commerce.product()),
  Description: Factory.each(() => faker.lorem.sentence()),
  Active: true,
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
