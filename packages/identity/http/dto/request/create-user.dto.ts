import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Roles } from 'packages/identity/core/enum/role.enum';

export class CreateUserRequestDto {
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
  readonly FirstName: string;

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
  readonly Photo?: string | null;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Roles,
    example: Roles.USER,
    default: Roles.USER,
  })
  @IsOptional()
  @IsEnum(Roles)
  readonly Role?: Roles = Roles.USER;
}
