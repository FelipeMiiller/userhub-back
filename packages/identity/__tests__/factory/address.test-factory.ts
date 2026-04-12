import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { Address, AddressType } from '../../persistence/entities/addresses.entities';

export const addressFactory = Factory.Sync.makeFactory<Partial<Address>>({
  Id: Factory.each(() => faker.string.uuid()),
  ProfileId: Factory.each(() => faker.string.uuid()),
  Type: 'home' as AddressType,
  Street: Factory.each(() => faker.location.street()),
  Number: Factory.each(() => faker.location.buildingNumber()),
  Complement: null,
  Neighborhood: Factory.each(() => faker.location.secondaryAddress()),
  City: Factory.each(() => faker.location.city()),
  State: Factory.each(() => faker.location.state()),
  Country: 'BR',
  ZipCode: Factory.each(() => faker.location.zipCode()),
  Formatted: null,
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
