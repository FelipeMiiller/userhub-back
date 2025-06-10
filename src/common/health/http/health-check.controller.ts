import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Cache } from 'cache-manager';
import { CacheThrottlerStorage } from 'src/common/throttler/domain/cache-throttler-storage';

import { EntityManager } from 'typeorm';
import { HealthResponseDto } from './dto/health.response.dto';
import { SkipThrottleForIp } from 'src/common/throttler/domain/decorators/skip-throttle.decorator';

import { SkipLogging } from 'src/common/interceptors/decorator/skip-logging.decorator';
import { Public } from 'src/modules/auth/domain/decorator/public.decorator';
import { AllowedAccess } from 'src/common/throttler/domain/decorators/allowed-access.decorator';

@Public()
@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private readonly cacheStorage: CacheThrottlerStorage,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
    private readonly entityManager: EntityManager,
  ) {}

  @ApiOperation({ summary: 'Health check detalhado com testes de serviços' })
  @ApiResponse({
    status: 200,
    description: 'Retorna status detalhado dos serviços',
    type: HealthResponseDto,
  })
  @Get('detailed')
  @SkipThrottleForIp([])
  @AllowedAccess([])
  @SkipLogging()
  async detailedHealthCheck() {
    try {
      // Testa conexão com cache
      const testKey = `health-check-${Date.now()}`;
      await this.cacheManager.set(testKey, 'test', 1000);
      const testValue = await this.cacheManager.get(testKey);

      // Testa throttler storage
      const throttlerTest = await this.cacheStorage.increment('health-test', 1000, 1, 0);

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          cache: testValue === 'test' ? 'healthy' : 'unhealthy',
          throttler: 'healthy',
          database: await this.checkDatabase(),
        },
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          throttlerHits: throttlerTest.totalHits,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Health check interno para rede' })
  @ApiResponse({
    status: 200,
    description: 'Retorna status dos serviços internos',
    type: HealthResponseDto,
  })
  @Get('internal')
  @SkipThrottleForIp([])
  @AllowedAccess([])
  @SkipLogging()
  async internalHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      internal: true,
      environment: process.env.NODE_ENV,
      services: await this.getAllServicesStatus(),
    };
  }

  @ApiOperation({ summary: 'Health check para load balancer' })
  @ApiResponse({
    status: 200,
    description: 'Retorna status básico para load balancer',
    type: HealthResponseDto,
  })
  @Get('lb')
  @AllowedAccess([])
  @SkipThrottleForIp([])
  @SkipLogging()
  async loadBalancerHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      ready: true,
    };
  }

  @ApiOperation({ summary: 'Health check administrativo' })
  @ApiResponse({
    status: 200,
    description: 'Retorna informações detalhadas do sistema',
    type: HealthResponseDto,
  })
  @Get('admin')
  @AllowedAccess([])
  @SkipThrottleForIp([])
  @SkipLogging()
  async adminHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      admin: true,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV,
      },
      cache: await this.getCacheStats(),
      throttler: await this.getThrottlerStats(),
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.entityManager.query('SELECT 1');
      return 'healthy';
    } catch (error) {
      console.error('Erro ao verificar conexão com o banco de dados:', error);
      return 'unhealthy';
    }
  }

  private async getAllServicesStatus() {
    return {
      cache: 'healthy',
      database: await this.checkDatabase(),
      externalApis: 'healthy',
    };
  }

  private async getCacheStats() {
    try {
      const testKey = 'cache-stats-test';
      const start = Date.now();
      await this.cacheManager.set(testKey, 'test', 1000);
      await this.cacheManager.get(testKey);
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private async getThrottlerStats() {
    try {
      const testResult = await this.cacheStorage.increment('throttler-stats-test', 1000, 100, 0);

      return {
        status: 'healthy',
        testHits: testResult.totalHits,
        timeToExpire: testResult.timeToExpire,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
