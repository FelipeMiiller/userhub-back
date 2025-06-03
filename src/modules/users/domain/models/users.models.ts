import { Exclude, Expose } from 'class-transformer';

export enum Roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export class User {
  Id: string;
  Email: string;
  @Exclude()
  Password: string;
  Name: string;
  LastName: string | null;
  AvatarUrl: string | null;
  @Exclude()
  HashRefreshToken: string;
  Role: Roles;
  Status: boolean;
  LastLoginAt?: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
