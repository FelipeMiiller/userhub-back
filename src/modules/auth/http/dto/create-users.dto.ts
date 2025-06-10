import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UserInputAuth {
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
}
