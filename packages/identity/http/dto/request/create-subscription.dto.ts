import { IsNotEmpty, IsUUID } from 'class-validator';
import { IsULID } from 'shared/lib/utils/validators/is-ulid.validator';

export class CreateSubscriptionRequestDto {
  @IsULID()
  @IsNotEmpty()
  readonly PlanId: string;
}
