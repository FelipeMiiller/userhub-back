import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, IdentityPermissions } from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { SystemModuleService } from '../../core/services/system-module.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('catalog')
@Controller('catalog/modules')
export class SystemModuleController {
  constructor(private readonly systemModuleService: SystemModuleService) {}

  @Permission(IdentityPermissions.CATALOG_MODULE_LIST)
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista todos os módulos disponíveis na plataforma' })
  @ApiResponse({ status: 200 })
  async findAll() {
    return this.systemModuleService.findAll();
  }

  @Permission(IdentityPermissions.CATALOG_MODULE_VIEW)
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
}
