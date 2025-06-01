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

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiBody({ type: UserInput })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserOutput })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async create(@Body() userDto: UserInput): Promise<UserOutput> {
    const user = await this.usersService.create(userDto);
    return instanceToPlain<User>(user) as UserOutput;
  }

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários (paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de usuários', type: [UserOutput] })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<UserOutput[]> {
    const users = await this.usersService.findMany({ page, limit });
    return users.map((u) => instanceToPlain<User>(u)) as UserOutput[];
  }

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Get(':id')
  @ApiOperation({ summary: 'Busca usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Usuário encontrado', type: UserOutput })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(@Param('id') id: string): Promise<UserOutput | null> {
    const user = await this.usersService.findOneById(id);
    if (!user) return null;
    return instanceToPlain<User>(user) as UserOutput;
  }

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Get('email/:email')
  @ApiOperation({ summary: 'Busca usuário por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ status: 200, description: 'Usuário encontrado', type: UserOutput })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findByEmail(@Param('email') email: string): Promise<UserOutput | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return null;
    return instanceToPlain<User>(user) as UserOutput;
  }

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUser })
  @ApiResponse({ status: 200, description: 'Usuário atualizado', type: UserOutput })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async update(@Param('id') id: string, @Body() dto: UpdateUser): Promise<UserOutput> {
    const user = await this.usersService.update(id, dto);
    return instanceToPlain<User>(user) as UserOutput;
  }

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Delete(':id')
  @ApiOperation({ summary: 'Remove usuário por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}
