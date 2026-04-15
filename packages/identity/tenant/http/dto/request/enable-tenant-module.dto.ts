import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnableTenantModuleDto {
  @ApiProperty({ example: 'uuid-of-system-module' })
  @IsUUID()
  readonly SystemModuleId: string;
}
