import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, IdentityPermissions } from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { SystemResourceService } from '../../core/services/system-resource.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('catalog')
@Controller('catalog/modules/:moduleId/resources')
export class SystemResourceController {
  constructor(private readonly systemResourceService: SystemResourceService) {}

  @Permission(IdentityPermissions.CATALOG_MODULE_LIST)
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista recursos de um módulo do catálogo' })
  @ApiParam({ name: 'moduleId', type: String })
  @ApiResponse({ status: 200 })
  async findAll(@Param('moduleId') moduleId: string) {
    return this.systemResourceService.findAllByModule(moduleId);
  }

  @Permission(IdentityPermissions.CATALOG_MODULE_VIEW)
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
}
