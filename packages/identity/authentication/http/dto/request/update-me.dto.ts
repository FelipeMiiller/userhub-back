import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeRequestDto {
  @ApiPropertyOptional({ description: 'Novo email do usuário', maxLength: 255 })
  @IsString()
  @IsOptional()
  readonly Email?: string;

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


}
