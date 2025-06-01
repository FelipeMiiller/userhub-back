import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProfileOutput {
  readonly id: string;
  readonly name: string;
  readonly lastName?: string;
  readonly bio?: string;
  readonly avatarUrl?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
