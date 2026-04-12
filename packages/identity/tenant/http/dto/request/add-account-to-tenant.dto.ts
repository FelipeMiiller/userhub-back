import { IsIn, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddAccountToTenantDto {
  @ApiProperty({ description: 'ID da account a ser adicionada', example: 'uuid-da-account' })
  @IsUUID()
  @IsNotEmpty()
  readonly AccountId: string;

  @ApiPropertyOptional({ description: 'ID do role no tenant', example: 'uuid-do-role' })
  @IsUUID()
  @IsOptional()
  readonly TenantRoleId?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'pending'], default: 'active' })
  @IsIn(['active', 'inactive', 'pending'])
  @IsOptional()
  readonly Status?: 'active' | 'inactive' | 'pending';
}
