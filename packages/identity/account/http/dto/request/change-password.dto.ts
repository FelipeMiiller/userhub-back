import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ChangePasswordRequestDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'senhaAtual123',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  readonly Password: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'novaSenha123',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  readonly NewPassword: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@email.com',
    maxLength: 255,
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly Email: string;
}
