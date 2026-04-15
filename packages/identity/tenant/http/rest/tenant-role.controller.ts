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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  JwtAuthGuard,
  TenantContextGuard,
  IdentityPermissions,
} from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { TenantRoleService } from '../../core/services/tenant-role.service';
import { CreateTenantRoleDto } from '../dto/request/create-tenant-role.dto';
import { AddRolePermissionDto } from '../dto/request/add-role-permission.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard)
@ApiTags('tenant-roles')
@Controller('tenants/:tenantId/roles')
export class TenantRoleController {
  constructor(private readonly tenantRoleService: TenantRoleService) {}

  @Permission(IdentityPermissions.TENANT_ROLE_LIST)
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista roles de um tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  async findAll(@Param('tenantId') tenantId: string) {
    return this.tenantRoleService.findAllByTenant(tenantId);
  }

  @Permission(IdentityPermissions.TENANT_ROLE_VIEW)
  @UseGuards(PermissionGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Busca role por ID' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'id', type: String })
  async findById(@Param('id') id: string) {
    const role = await this.tenantRoleService.findOneById(id);
    if (!role) throw new NotFoundException(`TenantRole '${id}' não encontrado`);
    return role;
  }

  @Permission(IdentityPermissions.TENANT_ROLE_CREATE)
  @UseGuards(PermissionGuard)
  @Post()
  @ApiOperation({ summary: 'Cria um role para um tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreateTenantRoleDto) {
    return this.tenantRoleService.create({ ...dto, TenantId: tenantId });
  }

  @Permission(IdentityPermissions.TENANT_ROLE_UPDATE)
  @UseGuards(PermissionGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um role' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTenantRoleDto>) {
    const role = await this.tenantRoleService.update(id, dto);
    if (!role) throw new NotFoundException(`TenantRole '${id}' não encontrado`);
    return role;
  }

  @Permission(IdentityPermissions.TENANT_ROLE_DELETE)
  @UseGuards(PermissionGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um role' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'id', type: String })
  async delete(@Param('id') id: string): Promise<void> {
    await this.tenantRoleService.delete(id);
  }

  @Permission(IdentityPermissions.TENANT_ROLE_UPDATE)
  @UseGuards(PermissionGuard)
  @Get(':id/permissions')
  @ApiOperation({ summary: 'Lista permissões de um role' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'id', type: String })
  async listPermissions(@Param('id') id: string) {
    return this.tenantRoleService.findPermissions(id);
  }

  @Permission(IdentityPermissions.TENANT_ROLE_UPDATE)
  @UseGuards(PermissionGuard)
  @Post(':id/permissions')
  @ApiOperation({ summary: 'Adiciona permissão a um role' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'id', type: String })
  async addPermission(@Param('id') id: string, @Body() dto: AddRolePermissionDto) {
    return this.tenantRoleService.addPermission(id, dto.PermissionId, dto.AllowedLevel, dto.Mode);
  }

  @Permission(IdentityPermissions.TENANT_ROLE_UPDATE)
  @UseGuards(PermissionGuard)
  @Delete(':id/permissions/:permissionMappingId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove permissão de um role' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'permissionMappingId', type: String })
  async removePermission(@Param('permissionMappingId') permissionMappingId: string): Promise<void> {
    await this.tenantRoleService.removePermission(permissionMappingId);
  }
}
