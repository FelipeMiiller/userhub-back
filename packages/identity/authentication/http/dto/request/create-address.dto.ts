import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiPropertyOptional({
    description: 'Tipo do endereço',
    enum: ['home', 'work', 'delivery', 'billing'],
    default: 'home',
  })
  @IsEnum(['home', 'work', 'delivery', 'billing'])
  @IsOptional()
  readonly Type?: 'home' | 'work' | 'delivery' | 'billing';

  @ApiProperty({ description: 'Logradouro', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly Street: string;

  @ApiPropertyOptional({ description: 'Número', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  readonly Number?: string | null;

  @ApiPropertyOptional({ description: 'Complemento', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly Complement?: string | null;

  @ApiPropertyOptional({ description: 'Bairro', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly Neighborhood?: string | null;

  @ApiProperty({ description: 'Cidade', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly City: string;

  @ApiProperty({ description: 'Estado / UF', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly State: string;

  @ApiPropertyOptional({ description: 'País (padrão: BR)', maxLength: 50, default: 'BR' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  readonly Country?: string;

  @ApiPropertyOptional({ description: 'CEP', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  readonly ZipCode?: string | null;

  @ApiPropertyOptional({ description: 'Endereço formatado completo', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  readonly Formatted?: string | null;

  @ApiPropertyOptional({ description: 'Latitude (WGS-84)', example: -22.949597 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  readonly Latitude?: number | null;

  @ApiPropertyOptional({ description: 'Longitude (WGS-84)', example: -42.956003 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  readonly Longitude?: number | null;
}
