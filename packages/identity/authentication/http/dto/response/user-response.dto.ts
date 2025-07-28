import { Expose } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Roles } from 'shared/modules/authorization/core/enum/role.enum';
import { DefaultResponseDto } from 'shared/core/dto/response/default-response.dto';

export class UserResponseDto extends DefaultResponseDto {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  readonly Email: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  readonly FirstName: string;

  @IsOptional()
  @IsString()
  @Expose()
  readonly LastName: string | null;

  @IsOptional()
  @IsString()
  @Expose()
  readonly Photo: string | null;

  @IsNotEmpty()
  @IsEnum(Roles)
  @Expose()
  readonly Role: Roles;

  @IsOptional()
  @IsDateString()
  @Expose()
  readonly LastLoginAt?: Date | null;
}
