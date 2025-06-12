import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecoveryPasswordDto {
  @ApiProperty({
    description: 'E-mail do usuário que deseja recuperar a senha',
    example: 'usuario@exemplo.com',
    required: true,
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;
}
