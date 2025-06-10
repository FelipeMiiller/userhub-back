import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ description: 'Status da saúde do serviço' })
  status: string;

  @ApiProperty({ description: 'Timestamp da verificação' })
  timestamp: string;

  @ApiProperty({ description: 'Nome do serviço' })
  service?: string;

  @ApiProperty({ description: 'Indica se é um check interno' })
  internal?: boolean;

  @ApiProperty({ description: 'Indica se é um check administrativo' })
  admin?: boolean;

  @ApiProperty({ description: 'Indica se está pronto para load balancer' })
  ready?: boolean;

  @ApiProperty({ description: 'Ambiente de execução' })
  environment?: string;

  @ApiProperty({ description: 'Serviços e seu status' })
  services?: {
    cache?: string;
    throttler?: string;
    database?: string;
    externalApis?: string;
  };

  @ApiProperty({ description: 'Métricas do sistema' })
  metrics?: {
    uptime?: number;
    memory?: {
      rss?: number;
      heapTotal?: number;
      heapUsed?: number;
      external?: number;
      arrayBuffers?: number;
    };
    throttlerHits?: number;
  };

  @ApiProperty({ description: 'Informações do sistema' })
  system?: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    env: string;
  };

  @ApiProperty({ description: 'Estatísticas do cache' })
  cache?: {
    status: string;
    responseTime: string;
  };

  @ApiProperty({ description: 'Estatísticas do throttler' })
  throttler?: {
    status: string;
    testHits: number;
    timeToExpire: number;
  };

  @ApiProperty({ description: 'Mensagem de erro' })
  error?: string;
}
