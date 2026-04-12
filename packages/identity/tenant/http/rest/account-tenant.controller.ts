import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@hub/shared-module/authorization';
import { Permission } from '../../../core/decorators/permission.decorator';
import { PermissionGuard } from '../../../core/guards/permission.guard';
import { AccountTenantService } from '../../core/services/account-tenant.service';
import { AddAccountToTenantDto } from '../dto/request/add-account-to-tenant.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('tenants')
@Controller('tenants/:tenantId/members')
export class AccountTenantController {
  constructor(private readonly accountTenantService: AccountTenantService) {}

  @Permission('identity.account-tenant.list')
  @UseGuards(PermissionGuard)
  @Get()
  @ApiOperation({ summary: 'Lista membros do tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiResponse({ status: 200 })
  async findAll(@Param('tenantId') tenantId: string) {
    return this.accountTenantService.findAllByTenant(tenantId);
  }

  @Permission('identity.account-tenant.create')
  @UseGuards(PermissionGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adiciona account ao tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiResponse({ status: 201, description: 'Membership criada' })
  @ApiResponse({ status: 404, description: 'Account ou tenant não encontrado' })
  @ApiResponse({ status: 409, description: 'Account já é membro deste tenant' })
  async addMember(
    @Param('tenantId') tenantId: string,
    @Body() dto: AddAccountToTenantDto,
  ) {
    return this.accountTenantService.addMember({
      AccountId: dto.AccountId,
      TenantId: tenantId,
      TenantRoleId: dto.TenantRoleId,
      Status: dto.Status,
    });
  }

  @Permission('identity.account-tenant.delete')
  @UseGuards(PermissionGuard)
  @Delete(':accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove account do tenant' })
  @ApiParam({ name: 'tenantId', type: String })
  @ApiParam({ name: 'accountId', type: String })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Membership não encontrada' })
  async removeMember(
    @Param('tenantId') tenantId: string,
    @Param('accountId') accountId: string,
  ) {
    const membership = await this.accountTenantService.findMembership(accountId, tenantId);
    if (!membership) throw new NotFoundException('Membership não encontrada');
    await this.accountTenantService.remove(membership.Id);
  }
}
