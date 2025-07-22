import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'packages/identity/core/decorator/public.decorator';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  @Public()
  @ApiOperation({ summary: 'Health check básico da aplicação' })
  @ApiResponse({
    status: 200,
    description: 'Retorna status básico da aplicação',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
