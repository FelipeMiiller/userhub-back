import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  JwtAuthGuard,
  TenantContextGuard,
  IdentityPermissions,
} from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { AccountTenantService } from '../../core/services/account-tenant.service';
import { AddressService } from '../../../authentication/core/services/address.service';
import { CreateAddressDto } from '../../../authentication/http/dto/request/create-address.dto';
import { UpdateAddressDto } from '../../../authentication/http/dto/request/update-address.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard)
@ApiTags('tenants')
@Controller('tenants/:tenantId/members/:accountId/addresses')
export class TenantMemberAddressController {
  constructor(
    private readonly addressService: AddressService,
    private readonly accountTenantService: AccountTenantService,
  ) {}

  private async assertMembership(accountId: string, tenantId: string): Promise<void> {
    const membership = await this.accountTenantService.findMembership(accountId, tenantId);
    if (!membership) throw new NotFoundException('Account não é membro deste tenant.');
  }

  @Permission(IdentityPermissions.ADDRESS_LIST)
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista endereços de um membro do tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'accountId', type: String })
  @ApiResponse({ status: 200 })
  async findAll(
    @Param('tenantId') tenantId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ) {
    await this.assertMembership(accountId, tenantId);
    return this.addressService.findAllByAccountInTenant(accountId);
  }

  @Permission(IdentityPermissions.ADDRESS_VIEW)
  @UseGuards(PermissionGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Busca endereço de um membro do tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.assertMembership(accountId, tenantId);
    return this.addressService.findByIdForAccountInTenant(id, accountId);
  }

  @Permission(IdentityPermissions.ADDRESS_CREATE)
  @UseGuards(PermissionGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria endereço para um membro do tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'accountId', type: String })
  @ApiBody({ type: CreateAddressDto })
  @ApiResponse({ status: 201, description: 'Endereço criado' })
  async create(
    @Param('tenantId') tenantId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: CreateAddressDto,
  ) {
    await this.assertMembership(accountId, tenantId);
    return this.addressService.createForAccountInTenant(accountId, dto);
  }

  @Permission(IdentityPermissions.ADDRESS_UPDATE)
  @UseGuards(PermissionGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza endereço de um membro do tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateAddressDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async update(
    @Param('tenantId') tenantId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    await this.assertMembership(accountId, tenantId);
    return this.addressService.updateForAccountInTenant(id, accountId, dto);
  }

  @Permission(IdentityPermissions.ADDRESS_DELETE)
  @UseGuards(PermissionGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove endereço de um membro do tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.assertMembership(accountId, tenantId);
    await this.addressService.deleteForAccountInTenant(id, accountId);
  }
}
