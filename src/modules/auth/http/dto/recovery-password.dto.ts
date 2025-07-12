import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RecoveryPasswordDto {
  @ApiProperty({
    description: 'E-mail do usuário que deseja recuperar a senha',
    example: 'usuario@exemplo.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly Email: string;
}
