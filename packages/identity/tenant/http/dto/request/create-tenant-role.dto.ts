import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantRoleDto {
  @ApiPropertyOptional({ example: 'uuid-of-tenant' })
  @IsUUID()
  @IsOptional()
  readonly TenantId?: string;

  @ApiProperty({ example: 'Manager' })
  @IsString()
  @IsNotEmpty()
  readonly Name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly Description?: string;
}
