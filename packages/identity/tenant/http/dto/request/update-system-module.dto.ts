import { PartialType } from '@nestjs/swagger';
import { CreateSystemModuleDto } from './create-system-module.dto';

export class UpdateSystemModuleDto extends PartialType(CreateSystemModuleDto) {}
