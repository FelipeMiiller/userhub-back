import { IsIn, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddRolePermissionDto {
  @ApiProperty({ example: 'uuid-of-permission' })
  @IsUUID()
  @IsNotEmpty()
  readonly PermissionId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly AllowedLevel?: number;

  @ApiPropertyOptional({ enum: ['allow', 'deny'], default: 'allow' })
  @IsOptional()
  @IsIn(['allow', 'deny'])
  readonly Mode?: 'allow' | 'deny';
}
