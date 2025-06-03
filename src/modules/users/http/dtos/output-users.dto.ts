import { Roles, User } from '../../domain/models/users.models';

export class UserOutput {
  readonly Id: string;
  readonly Email: string;
  readonly Name: string;
  readonly LastName: string | null;
  readonly AvatarUrl: string | null;
  readonly Role: Roles;
  readonly Status: boolean;
  LastLoginAt?: Date | null;
  readonly CreatedAt: Date;
  readonly UpdatedAt: Date;
}
