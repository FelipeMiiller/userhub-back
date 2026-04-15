import { Expose } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DefaultResponseDto } from '@hub/shared-lib';

export class UserResponseDto extends DefaultResponseDto {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  readonly Email: string;

  @IsOptional()
  @IsString()
  @Expose()
  readonly FirstName?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  readonly Status?: boolean;
}
