import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  JwtAuthGuard,
  TenantContextGuard,
  IdentityPermissions,
} from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { TenantModuleService } from '../../core/services/tenant-module.service';
import { EnableTenantModuleDto } from '../dto/request/enable-tenant-module.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard)
@ApiTags('tenant-modules')
@Controller('tenants/:tenantId/modules')
export class TenantModuleController {
  constructor(private readonly tenantModuleService: TenantModuleService) {}

  @Permission(IdentityPermissions.TENANT_MODULE_LIST)
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista módulos habilitados para o tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiResponse({ status: 200 })
  async findAll(@Param('tenantId') tenantId: string) {
    return this.tenantModuleService.listModules(tenantId);
  }

  @Permission(IdentityPermissions.TENANT_MODULE_CREATE)
  @UseGuards(PermissionGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Habilita um módulo para o tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiResponse({ status: 201, description: 'Módulo habilitado' })
  @ApiResponse({ status: 404, description: 'Tenant ou SystemModule não encontrado' })
  @ApiResponse({ status: 409, description: 'Módulo já está ativo para este tenant' })
  async enable(@Param('tenantId') tenantId: string, @Body() dto: EnableTenantModuleDto) {
    return this.tenantModuleService.enableModule(tenantId, dto.SystemModuleId);
  }

  @Permission(IdentityPermissions.TENANT_MODULE_DELETE)
  @UseGuards(PermissionGuard)
  @Delete(':moduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desabilita um módulo do tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'moduleId', type: String })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Módulo não habilitado para este tenant' })
  async disable(
    @Param('tenantId') tenantId: string,
    @Param('moduleId') moduleId: string,
  ): Promise<void> {
    await this.tenantModuleService.disableModule(tenantId, moduleId);
  }
}
