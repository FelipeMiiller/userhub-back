import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { SystemModuleService } from '../../core/services/system-module.service';
import { CreateSystemModuleDto } from '../dto/request/create-system-module.dto';
import { UpdateSystemModuleDto } from '../dto/request/update-system-module.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('system-modules')
@Controller('system-modules')
export class SystemModuleController {
  constructor(private readonly systemModuleService: SystemModuleService) {}

  @Permission('identity.system-module.list')
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista todos os módulos do sistema' })
  @ApiResponse({ status: 200 })
  async findAll() {
    return this.systemModuleService.findAll();
  }

  @Permission('identity.system-module.view')
  @UseGuards(PermissionGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Busca módulo por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async findById(@Param('id') id: string) {
    const mod = await this.systemModuleService.findOneById(id);
    if (!mod) throw new NotFoundException(`SystemModule '${id}' não encontrado`);
    return mod;
  }

  @Permission('identity.system-module.create')
  @UseGuards(PermissionGuard)
  @Post()
  @ApiOperation({ summary: 'Cria um módulo do sistema' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateSystemModuleDto) {
    return this.systemModuleService.create(dto);
  }

  @Permission('identity.system-module.update')
  @UseGuards(PermissionGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um módulo do sistema' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateSystemModuleDto) {
    const mod = await this.systemModuleService.update(id, dto);
    if (!mod) throw new NotFoundException(`SystemModule '${id}' não encontrado`);
    return mod;
  }

  @Permission('identity.system-module.delete')
  @UseGuards(PermissionGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um módulo do sistema' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.systemModuleService.delete(id);
  }
}
