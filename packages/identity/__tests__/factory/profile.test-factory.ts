import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { Profile } from '../../persistence/entities/profiles.entities';

export const profileFactory = Factory.Sync.makeFactory<Partial<Profile>>({
  Id: Factory.each(() => faker.string.uuid()),
  FirstName: Factory.each(() => faker.person.firstName()),
  LastName: Factory.each(() => faker.person.lastName()),
  DisplayName: Factory.each(() => faker.person.fullName()),
  Email: Factory.each(() => faker.internet.email()),
  Phone: Factory.each(() => faker.phone.number()),
  Photo: null,
  Cpf: null,
  AccountId: null,
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
