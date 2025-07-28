import { IsOptional, IsString, IsEnum, IsUrl, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Roles } from 'shared/modules/authorization/core/enum/role.enum';

export class UpdateUserRequestDto {
  @ApiPropertyOptional({ description: 'Novo email do usuário', maxLength: 255 })
  @IsString()
  @IsOptional()
  readonly Email?: string;

  @ApiPropertyOptional({ description: 'Nova senha do usuário', minLength: 8 })
  @IsString()
  @IsOptional()
  readonly Password?: string;

  @ApiPropertyOptional({ description: 'Nome do usuário', maxLength: 100 })
  @IsString()
  @IsOptional()
  readonly FirstName?: string;

  @ApiPropertyOptional({ description: 'Sobrenome do usuário', maxLength: 100 })
  @IsString()
  @IsOptional()
  readonly LastName?: string;

  @ApiPropertyOptional({ description: 'URL do avatar', maxLength: 255 })
  @IsUrl()
  @IsOptional()
  readonly Photo?: string;

  @ApiPropertyOptional({ description: 'Novo papel do usuário', enum: Roles })
  @IsEnum(Roles)
  @IsOptional()
  readonly Role?: Roles;

  @ApiPropertyOptional({ description: 'Status do usuário (ativo/inativo)' })
  @IsBoolean()
  @IsOptional()
  readonly Status?: boolean;
}
