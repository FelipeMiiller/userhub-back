import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { LoggersRepository } from '../domain/repositories/logger.repository';
import { JwtAuthGuard } from 'src/modules/auth/domain/guards/jwt-auth.guard';
import { RolesGuards } from 'src/modules/auth/domain/decorator/roles.decorator';
import { Roles } from 'src/modules/users/domain/models/users.models';
import { Request } from 'express';
import { Payload } from 'src/modules/auth/domain/types';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loggers')
export class LoggersController {
  constructor(private readonly loggersRepository: LoggersRepository) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os logs' })
  @RolesGuards([Roles.ADMIN])
  findAll() {
    return this.loggersRepository.findAll();
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Lista logs por usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @RolesGuards([Roles.ADMIN])
  findAllByUserId(@Param('id') id: string) {
    return this.loggersRepository.findAllByUserId(id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lista logs por usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  findAllByUser(@Req() req: Request) {
    const user = req['user'] as Payload;
    return this.loggersRepository.findAllByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca log por ID' })
  @ApiParam({ name: 'id', description: 'ID do log' })
  @RolesGuards([Roles.ADMIN])
  findOne(@Param('id') id: string) {
    return this.loggersRepository.findOne(id);
  }
}
