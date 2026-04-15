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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard, Payload } from '@hub/shared-module/authorization';
import { AccountService } from '../core/services/account.service';
import { AddressService } from '../core/services/address.service';
import { UserResponseDto } from './dto/response/user-response.dto';
import { UpdateMeRequestDto } from './dto/request/update-me.dto';
import { CreateAddressDto } from './dto/request/create-address.dto';
import { UpdateAddressDto } from './dto/request/update-address.dto';

type AuthRequest = Omit<Request, 'user'> & { user: Payload };

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('auth')
@Controller('auth/me')
export class MeController {
  constructor(
    private readonly accountService: AccountService,
    private readonly addressService: AddressService,
  ) {}

  // ── Profile ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Retorna dados do account autenticado' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Account não encontrado' })
  async getMe(@Req() req: AuthRequest): Promise<UserResponseDto> {
    const { sub, email }: Payload = req['user'];
    const user = await this.accountService.findMe(sub);
    if (!user) throw new NotFoundException(`User not found ${email}`);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  @Patch()
  @ApiOperation({ summary: 'Atualiza dados do account autenticado' })
  @ApiBody({ type: UpdateMeRequestDto })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMe(
    @Req() req: AuthRequest,
    @Body() dto: UpdateMeRequestDto,
  ): Promise<UserResponseDto> {
    const { sub, email }: Payload = req['user'];
    await this.accountService.updateMe(sub, dto);
    const user = await this.accountService.findMe(sub);
    if (!user) throw new NotFoundException(`User not found ${email}`);
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  // ── Addresses ──────────────────────────────────────────────────────────────

  @Get('addresses')
  @ApiOperation({ summary: 'Lista endereços do account autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de endereços' })
  async findAddresses(@Req() req: AuthRequest) {
    const { sub }: Payload = req['user'];
    return this.addressService.findAllByAccount(sub);
  }

  @Get('addresses/:id')
  @ApiOperation({ summary: 'Busca um endereço do account autenticado' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async findAddress(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    const { sub }: Payload = req['user'];
    return this.addressService.findByIdForAccount(id, sub);
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um endereço para o account autenticado' })
  @ApiResponse({ status: 201, description: 'Endereço criado' })
  async createAddress(@Req() req: AuthRequest, @Body() dto: CreateAddressDto) {
    const { sub }: Payload = req['user'];
    return this.addressService.createForAccount(sub, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Atualiza um endereço do account autenticado' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async updateAddress(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const { sub }: Payload = req['user'];
    return this.addressService.updateForAccount(id, sub, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um endereço do account autenticado' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async removeAddress(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    const { sub }: Payload = req['user'];
    await this.addressService.deleteForAccount(id, sub);
  }
}
