import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, ValidateNested } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileInputAuth } from './create-profile.dto';

export class UserInputAuth {
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

  @ApiProperty({
    description: 'User profile',
    type: () => ProfileInputAuth,
  })
  @IsNotEmpty()
  @ValidateNested()
  readonly Profile: ProfileInputAuth;
}
