import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '../../../../persistence/entities/tenants.entities';
import { IsEnum } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: 'Nome do tenant', maxLength: 255 })
  @IsString()
  @IsOptional()
  readonly Name?: string;

  @ApiPropertyOptional({ description: 'Slug único do tenant', maxLength: 100 })
  @IsString()
  @IsOptional()
  readonly Slug?: string;

  @ApiPropertyOptional({
    description: 'Status do tenant',
    enum: ['active', 'inactive', 'suspended'],
  })
  @IsEnum(['active', 'inactive', 'suspended'])
  @IsOptional()
  readonly Status?: TenantStatus;
}
