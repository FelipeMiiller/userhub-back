import { Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  TenantContextGuard,
  IdentityPermissions,
} from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { TenantService } from '../../core/services/tenant.service';
import { UpdateTenantDto } from '../dto/request/update-tenant.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard)
@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Permission(IdentityPermissions.TENANT_VIEW)
  @UseGuards(PermissionGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Busca tenant por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async findById(@Param('id') id: string) {
    const tenant = await this.tenantService.findOneById(id);
    if (!tenant) throw new NotFoundException(`Tenant '${id}' não encontrado`);
    return tenant;
  }

  @Permission(IdentityPermissions.TENANT_UPDATE)
  @UseGuards(PermissionGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza tenant por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const tenant = await this.tenantService.update(id, dto);
    if (!tenant) throw new NotFoundException(`Tenant '${id}' não encontrado`);
    return tenant;
  }
}
