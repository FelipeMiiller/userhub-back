import { Expose } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export abstract class DefaultResponseDto {
  @ApiProperty({ format: 'uuid', example: '018f1b2c-3d4e-7a8b-9c0d-ef1234567890' })
  @IsUUID('7')
  @IsNotEmpty()
  @Expose()
  readonly Id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsDateString()
  @Expose()
  readonly CreatedAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsDateString()
  @Expose()
  readonly UpdatedAt: Date;

  @ApiPropertyOptional({ example: null, nullable: true })
  @IsDateString()
  @Expose()
  @IsOptional()
  readonly DeletedAt: Date | null;
}
