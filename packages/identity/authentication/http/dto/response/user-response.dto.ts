import { Expose } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DefaultResponseDto } from '@hub/shared-lib';

export class UserResponseDto extends DefaultResponseDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  readonly Email: string;

  @ApiPropertyOptional({ example: 'João' })
  @IsOptional()
  @IsString()
  @Expose()
  readonly FirstName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Expose()
  readonly Status?: boolean;
}
