import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'uuid-of-module' })
  @IsUUID()
  @IsNotEmpty()
  readonly ModuleId: string;

  @ApiProperty({ example: 'uuid-of-resource' })
  @IsUUID()
  @IsNotEmpty()
  readonly ResourceId: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  @IsNotEmpty()
  readonly Action: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly Description?: string;
}
