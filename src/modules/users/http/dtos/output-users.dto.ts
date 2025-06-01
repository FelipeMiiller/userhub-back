import { ObjectType } from '@nestjs/graphql';
import { ProfileOutput } from './output-profile.dto';

@ObjectType()
export class UserOutput {
  readonly id: string;
  readonly email: string;
  readonly profile?: ProfileOutput;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
