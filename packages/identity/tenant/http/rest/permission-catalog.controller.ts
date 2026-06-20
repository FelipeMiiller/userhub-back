import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, IdentityPermissions } from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { PermissionCatalogService } from '../../core/services/permission-catalog.service';
import { CreatePermissionDto } from '../dto/request/create-permission.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('permissions')
@Controller('permissions')
export class PermissionCatalogController {
  constructor(private readonly permissionCatalogService: PermissionCatalogService) {}

  @Permission(IdentityPermissions.PERMISSION_LIST)
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista todas as permissões' })
  @ApiResponse({ status: 200 })
  async findAll() {
    return this.permissionCatalogService.findAll();
  }

  @Permission(IdentityPermissions.PERMISSION_VIEW)
  @UseGuards(PermissionGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Busca permissão por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async findById(@Param('id') id: string) {
    const perm = await this.permissionCatalogService.findOneById(id);
    if (!perm) throw new NotFoundException(`Permission '${id}' não encontrada`);
    return perm;
  }

  @Permission(IdentityPermissions.PERMISSION_CREATE)
  @UseGuards(PermissionGuard)
  @Post()
  @ApiOperation({ summary: 'Cria uma permissão (Name gerado automaticamente)' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionCatalogService.create(dto);
  }

  @Permission(IdentityPermissions.PERMISSION_DELETE)
  @UseGuards(PermissionGuard)
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove uma permissão' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.permissionCatalogService.delete(id);
  }
}
