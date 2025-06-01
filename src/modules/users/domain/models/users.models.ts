import { Exclude } from 'class-transformer';
import { Profile } from './profile.models';

export enum Roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
}

export class User {
  readonly Id: string;
  readonly Email: string;
  @Exclude()
  readonly Password: string;
  @Exclude()
  readonly HashRefreshToken: string;
  readonly Role: Roles;
  readonly Status: boolean;
  readonly Profile: Profile | null;
  readonly CreatedAt: Date;
  readonly UpdatedAt: Date;
}
