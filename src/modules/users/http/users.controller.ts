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
import { instanceToPlain } from 'class-transformer';
import { UserOutput } from './dtos/output-users.dto';
import { UsersService } from '../domain/users.service';
import { UpdateUser } from './dtos/update-users.dto';
import { UserInput } from './dtos/create-users.dto';
import { RolesGuards } from 'src/modules/auth/domain/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/domain/guards/jwt-auth.guard';
import { Roles, User } from '../domain/models/users.models';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RolesGuards([Roles.ADMIN])
  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiBody({ type: UserInput })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserOutput })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async create(@Body() userDto: UserInput): Promise<UserOutput> {
    const user = await this.usersService.create(userDto);
    return instanceToPlain<User>(user) as UserOutput;
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
  @ApiResponse({ status: 200, description: 'Lista de usuários', type: [UserOutput] })
  async findAll(
    @Query('role') role?: Roles,
    @Query('sortBy') sortBy: string = 'Name',
    @Query('order') order: 'asc' | 'desc' = 'asc',
  ): Promise<UserOutput[]> {
    const users = await this.usersService.findMany({ role, sortBy, order });
    return users.map((u) => instanceToPlain<User>(u)) as UserOutput[];
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @RolesGuards([Roles.ADMIN])
  @Get('inactive')
  @ApiOperation({ summary: 'Lista usuários inativos (sem login recente)' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Dias sem login (default: 30)',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários inativos', type: [UserOutput] })
  async findInactive(@Query('days') days = 30): Promise<UserOutput[]> {
    const users = await this.usersService.findInactive(days);
    return users.map((u) => instanceToPlain<User>(u)) as UserOutput[];
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @RolesGuards([Roles.ADMIN])
  @Get(':id')
  @ApiOperation({ summary: 'Busca usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Usuário encontrado', type: UserOutput })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(@Param('id') id: string): Promise<UserOutput | null> {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException(`Usuário com ID '${id}' não encontrado`);
    }
    return instanceToPlain<User>(user) as UserOutput;
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @RolesGuards([Roles.ADMIN])
  @Get('email/:email')
  @ApiOperation({ summary: 'Busca usuário por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ status: 200, description: 'Usuário encontrado', type: UserOutput })
  async findByEmail(@Param('email') email: string): Promise<UserOutput | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return null;
    return instanceToPlain<User>(user) as UserOutput;
  }

  @RolesGuards([Roles.ADMIN, Roles.USER])
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUser })
  @ApiResponse({ status: 200, description: 'Usuário atualizado', type: UserOutput })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUser,
    @Req() req: Request,
  ): Promise<UserOutput> {
    if (req['user'].role !== Roles.ADMIN && req['user'].sub !== id) {
      throw new UnauthorizedException('Apenas administradores podem atualizar outros usuários');
    }
    const user = await this.usersService.update(id, dto);
    return instanceToPlain<User>(user) as UserOutput;
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
