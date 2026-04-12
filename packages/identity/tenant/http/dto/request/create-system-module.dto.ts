import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateSystemModuleDto {
  @ApiProperty({ example: 'billing' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly Slug: string;

  @ApiProperty({ example: 'Billing' })
  @IsString()
  @IsNotEmpty()
  readonly Name: string;

  @ApiPropertyOptional({ example: 'Manages billing and invoices' })
  @IsOptional()
  @IsString()
  readonly Description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  readonly Active?: boolean;
}
