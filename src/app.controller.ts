import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './modules/auth/domain/decorator/public.decorator';
import { SkipLogging } from './common/interceptors/decorator/skip-logging.decorator';

@ApiTags('health')
@Controller('/')
export class AppController {
  @Public()
  @SkipLogging()
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
