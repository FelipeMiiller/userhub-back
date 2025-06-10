import {
  IsEmail,
  IsEnum,
  IsLowercase,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
} from 'class-validator';

import { Roles } from 'src/modules/users/domain/models/users.models';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UserInput {
  @ApiProperty({
    description: 'User email address',
    example: 'john@email.com',
    maxLength: 255,
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
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
    description: 'User name',
    example: 'John',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly Name: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly LastName?: string | null;

  @ApiPropertyOptional({
    description: 'URL for user avatar',
    example: 'https://example.com/avatar.jpg',
    maxLength: 255,
  })
  @IsUrl()
  @IsOptional()
  readonly AvatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Roles,
    example: Roles.USER,
    default: Roles.USER,
  })
  @IsOptional()
  @IsEnum(Roles)
  readonly Role?: Roles;
}
