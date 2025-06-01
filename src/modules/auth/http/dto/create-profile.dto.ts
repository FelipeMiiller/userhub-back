import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ProfileInputAuth {
  @ApiProperty({
    description: 'Nome do perfil',
    example: 'João',
    maxLength: 255,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  readonly Name: string;

  @ApiPropertyOptional({
    description: 'Sobrenome do perfil',
    example: 'Silva',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly LastName?: string;
}
