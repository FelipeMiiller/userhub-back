import { faker } from '@faker-js/faker';
import * as Factory from 'factory.ts';
import { Account } from '../../persistence/entities/accounts.entities';

export const accountFactory = Factory.Sync.makeFactory<Partial<Account>>({
  Id: Factory.each(() => faker.string.uuid()),
  Email: Factory.each(() => faker.internet.email()),
  Password: Factory.each(() => faker.internet.password()),
  HashRefreshToken: null,
  Provider: 'local',
  ProviderId: null,
  ExternalId: null,
  EmailVerified: false,
  Status: true,
  ProfileId: null,
  Metadata: null,
  CreatedAt: Factory.each(() => faker.date.recent()),
  UpdatedAt: Factory.each(() => faker.date.recent()),
  DeletedAt: null,
});
