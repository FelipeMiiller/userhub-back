import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { TenantModule } from '../../persistence/entities/tenantModules.entities';

export const tenantModuleFactory = Factory.Sync.makeFactory<Partial<TenantModule>>({
  Id: Factory.each(() => faker.string.uuid()),
  TenantId: Factory.each(() => faker.string.uuid()),
  SystemModuleId: Factory.each(() => faker.string.uuid()),
  Status: 'active',
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
