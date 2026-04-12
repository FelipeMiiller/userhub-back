import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateOnboardingTenantDto {
  @ApiProperty({ description: 'Nome do tenant (empresa/organização)', example: 'Minha Empresa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly Name: string;

  @ApiProperty({
    description: 'Slug único do tenant (lowercase, sem espaços)',
    example: 'minha-empresa',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  readonly Slug: string;
}
