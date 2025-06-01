export class Profile {
  readonly Id: string;
  readonly Name: string;
  readonly LastName: string | null;
  readonly Bio: string | null;
  readonly AvatarUrl: string | null;
  readonly UserId: string;
  readonly CreatedAt: Date;
  readonly UpdatedAt: Date;
}
