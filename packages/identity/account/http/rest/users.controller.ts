import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  UnauthorizedException,
  Req,
  HttpCode,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from 'shared/modules/authorization/core/guards/jwt-auth.guard';
import { RolesGuards } from 'shared/modules/authorization/core/decorator/roles.decorator';
import { Roles } from 'shared/modules/authorization/core/enum/role.enum';
import { UsersService } from '../../core/services/users.service';
import { CreateUserRequestDto } from '../dto/request/create-user.dto';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { UpdateUserRequestDto } from '../dto/request/update-users.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RolesGuards([Roles.ADMIN])
  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async create(@Body() userDto: CreateUserRequestDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(userDto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @RolesGuards([Roles.ADMIN])
  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários (paginado, filtro por role e ordenação)' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Roles,
    description: 'Filtrar por role (admin ou user)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Campo para ordenar (ex: Name, Email, CreatedAt)',
  })
  @ApiQuery({ name: 'order', required: false, type: String, description: 'asc ou desc' })
  @ApiResponse({ status: 200, description: 'Lista de usuários', type: [UserResponseDto] })
  async findAll(
    @Query('role') role?: Roles,
    @Query('sortBy') sortBy: string = 'Name',
    @Query('order') order: 'asc' | 'desc' = 'asc',
  ): Promise<UserResponseDto[]> {
    const users = await this.usersService.findMany({ role, sortBy, order });
    return users.map((u) =>
      plainToInstance(UserResponseDto, u, {
        excludeExtraneousValues: true,
      }),
    ) as UserResponseDto[];
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5)
  @RolesGuards([Roles.ADMIN])
  @Get('inactive')
  @ApiOperation({ summary: 'Lista usuários inativos (sem login recente)' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Dias sem login (default: 30)',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários inativos', type: [UserResponseDto] })
  async findInactive(@Query('days') days = 30): Promise<UserResponseDto[]> {
    const users = await this.usersService.findInactive(days);
    return users.map((u) =>
      plainToInstance(UserResponseDto, u, {
        excludeExtraneousValues: true,
      }),
    ) as UserResponseDto[];
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5)
  @RolesGuards([Roles.ADMIN])
  @Get(':id')
  @ApiOperation({ summary: 'Busca usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Usuário encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(@Param('id') id: string): Promise<UserResponseDto | null> {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException(`Usuário com ID '${id}' não encontrado`);
    }
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5)
  @RolesGuards([Roles.ADMIN])
  @Get('email/:email')
  @ApiOperation({ summary: 'Busca usuário por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ status: 200, description: 'Usuário encontrado', type: UserResponseDto })
  async findByEmail(@Param('email') email: string): Promise<UserResponseDto | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return null;
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @RolesGuards([Roles.ADMIN])
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserRequestDto })
  @ApiResponse({ status: 200, description: 'Usuário atualizado', type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, dto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @RolesGuards([Roles.ADMIN])
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}
