import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  ValidateNested,
} from 'class-validator';
import { TransformToHash } from 'src/common/shared/validators/TransformToHash.validator';
import { ProfileInput } from './create-profile.dto';
import { Roles } from 'src/modules/users/domain/models/users.models';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserInput {
  @ApiProperty({
    description: 'User email address',
    example: 'john@email.com',
    maxLength: 255,
  })
  @IsEmail()
  @IsNotEmpty()
  readonly Email: string;

  @ApiProperty({
    description: 'Strong password (min. 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)',
    example: 'Password@123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  readonly Password: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Roles,
    example: Roles.USER,
    default: Roles.USER,
  })
  @IsOptional()
  @IsEnum(Roles)
  readonly Role: Roles.USER;

  @ApiProperty({
    description: 'User profile',
    type: () => ProfileInput,
  })
  @IsNotEmpty()
  @ValidateNested()
  readonly Profile: ProfileInput;
}
