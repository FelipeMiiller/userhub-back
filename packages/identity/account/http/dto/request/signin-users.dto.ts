import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SigninRequestDto {
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
}
