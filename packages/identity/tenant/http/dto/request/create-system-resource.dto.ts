import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateSystemResourceDto {
  @ApiProperty({ example: 'uuid-of-module' })
  @IsUUID()
  @IsNotEmpty()
  readonly ModuleId: string;

  @ApiProperty({ example: 'invoice' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly Slug: string;

  @ApiProperty({ example: 'Invoice' })
  @IsString()
  @IsNotEmpty()
  readonly Name: string;

  @ApiPropertyOptional({ example: 'Invoice management' })
  @IsOptional()
  @IsString()
  readonly Description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  readonly Active?: boolean;
}
