import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './modules/auth/domain/decorator/public.decorator';

@ApiTags('health')
@Controller('/')
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check da aplicação' })
  @ApiResponse({
    status: 200,
    description: 'Aplicação saudável',
    schema: { example: { status: 'ok' } },
  })
  healthCheck() {
    return { status: 'ok' };
  }
}
