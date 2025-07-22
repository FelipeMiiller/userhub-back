import { DefaultModel } from 'shared/core/model/default.model';
import { Roles } from '../enum/role.enum';

export class User extends DefaultModel<User> {
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string | null;
  Photo: string | null;
  HashRefreshToken: string;
  Role: Roles;
  Status: boolean;
  LastLoginAt: Date | null;
  CreatedAt: Date;

  constructor(partial: Partial<User>) {
    super(partial);
  }
}
