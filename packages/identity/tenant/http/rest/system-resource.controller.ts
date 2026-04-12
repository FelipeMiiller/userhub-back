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
import { SystemResourceService } from '../../core/services/system-resource.service';
import { CreateSystemResourceDto } from '../dto/request/create-system-resource.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('system-modules')
@Controller('system-modules/:moduleId/resources')
export class SystemResourceController {
  constructor(private readonly systemResourceService: SystemResourceService) {}

  @Permission('identity.system-module.list')
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista recursos de um módulo' })
  @ApiParam({ name: 'moduleId', type: String })
  @ApiResponse({ status: 200 })
  async findAll(@Param('moduleId') moduleId: string) {
    return this.systemResourceService.findAllByModule(moduleId);
  }

  @Permission('identity.system-module.view')
  @UseGuards(PermissionGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Busca recurso por ID' })
  @ApiParam({ name: 'moduleId', type: String })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async findById(@Param('id') id: string) {
    const res = await this.systemResourceService.findOneById(id);
    if (!res) throw new NotFoundException(`SystemResource '${id}' não encontrado`);
    return res;
  }

  @Permission('identity.system-module.create')
  @UseGuards(PermissionGuard)
  @Post()
  @ApiOperation({ summary: 'Cria um recurso dentro de um módulo' })
  @ApiParam({ name: 'moduleId', type: String })
  @ApiResponse({ status: 201 })
  async create(@Param('moduleId') moduleId: string, @Body() dto: CreateSystemResourceDto) {
    return this.systemResourceService.create({ ...dto, ModuleId: moduleId });
  }

  @Permission('identity.system-module.update')
  @UseGuards(PermissionGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um recurso' })
  @ApiParam({ name: 'moduleId', type: String })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateSystemResourceDto>) {
    const res = await this.systemResourceService.update(id, dto);
    if (!res) throw new NotFoundException(`SystemResource '${id}' não encontrado`);
    return res;
  }

  @Permission('identity.system-module.delete')
  @UseGuards(PermissionGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um recurso' })
  @ApiParam({ name: 'moduleId', type: String })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.systemResourceService.delete(id);
  }
}
