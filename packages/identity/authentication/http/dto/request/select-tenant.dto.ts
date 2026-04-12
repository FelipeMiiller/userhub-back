import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SelectTenantDto {
  @ApiProperty({ description: 'ID do tenant a ser selecionado como contexto ativo' })
  @IsUUID()
  TenantId: string;
}
