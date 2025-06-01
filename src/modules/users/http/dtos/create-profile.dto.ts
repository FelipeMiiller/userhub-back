import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ProfileInput {
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

  @ApiPropertyOptional({
    description: 'Biografia do usuário',
    example: 'Desenvolvedor apaixonado por tecnologia',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  readonly Bio?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem de perfil',
    example: 'https://example.com/avatar.jpg',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly AvatarUrl?: string;
}
