import { Roles } from '@hub/shared-module/authorization/core/enum/role.enum';
import { DefaultResponseDto } from '@hub/shared/core/dto/response/default-response.dto';
export declare class UserResponseDto extends DefaultResponseDto {
  readonly Email: string;
  readonly FirstName: string;
  readonly LastName: string | null;
  readonly Photo: string | null;
  readonly Role: Roles;
  readonly LastLoginAt?: Date | null;
}
