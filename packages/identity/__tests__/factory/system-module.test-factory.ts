import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { SystemModule } from '../../persistence/entities/modules.entities';

export const systemModuleFactory = Factory.Sync.makeFactory<Partial<SystemModule>>({
  Id: Factory.each(() => faker.string.uuid()),
  Slug: Factory.each(() => faker.lorem.slug()),
  Name: Factory.each(() => faker.commerce.department()),
  Description: Factory.each(() => faker.lorem.sentence()),
  Active: true,
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
