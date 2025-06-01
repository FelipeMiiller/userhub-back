import { Body, Controller, Delete, Get, Param, Put, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/domain/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { RolesGuards } from 'src/modules/auth/domain/decorator/roles.decorator';

import { LoggerService } from 'src/common/loggers/domain/logger.service';
import { Roles } from '../domain/models/users.models';
import { ProfilesService } from '../domain/profiles.service';
import { Payload } from 'src/modules/auth/domain/types';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('profiles')
@Controller('profiles')
export class ProfileController {
  constructor(
    private readonly profileService: ProfilesService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = ProfileController.name;
  }

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Get(':id')
  @ApiOperation({ summary: 'Busca um perfil pelo ID' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  async findOne(@Param('id') id: string) {
    return this.profileService.findById(id);
  }

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Get('user/:id')
  @ApiOperation({ summary: 'Busca um perfil pelo ID do usuario' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  async findByIdUser(@Param('id') id: string) {
    return this.profileService.findByIdUser(id);
  }
  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um perfil existente' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  async update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(id, dto);
  }

  @RolesGuards([Roles.ADMIN, Roles.MODERATOR])
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um perfil pelo ID' })
  @ApiResponse({ status: 200, description: 'Perfil removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const { sub }: Payload = await req['user'];
    return this.profileService.remove(id).then(() => {
      this.loggerService.audit(
        `Perfil removido: ${id} por usuário: ${sub}`,
        { deletedProfileId: id, deletedByUserId: sub },
        sub,
      );
      return {
        message: 'Perfil removido com sucesso.',
        deletedProfileId: id,
        deletedByUserId: sub,
      };
    });
  }
}
