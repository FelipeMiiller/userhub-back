//https://docs.nestjs.com/microservices/exception-filters

import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { LoggerService } from 'shared/modules/loggers';
import { DomainException } from '../exeption/domain.exception';

// Interface para padronizar a resposta de erro
type ErrorResponse = {
  timestamp: string;
  message: string | object;
  context: string;
};

type ErroLog = {
  statusCode?: number;
  message: string;
  details?: Record<string, string>;
  pattern?: string;
  stackTrace?: string;
  path?: string;
  httpMethod?: string;
  module?: string;
};

@Catch()
export class MicroserviceExceptionFilter implements RpcExceptionFilter<RpcException> {
  constructor(
    public readonly module: string,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = 'MicroserviceExceptionFilter';
  }

  catch(exception: unknown, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToRpc();

    const pattern = ctx.getContext();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal Server Error';
    let details: Record<string, string> = {};
    let context: string | undefined = 'Unknown';
    let stackTrace: string | undefined = (exception as any)?.stack;

    const errorResponse: ErrorResponse = {
      timestamp: new Date().toISOString(),
      message,
      context,
    };

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
        errorResponse.message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        // NestJS ValidationPipe errors often return an object with a 'message' array
        message = (responseBody as any).message || 'Http Exception';
        details = (responseBody as any).details;
        context = exception.constructor.name;
        errorResponse.message = (responseBody as any).message || 'Http Exception';
      }
    }
    if (exception instanceof DomainException) {
      // Tratamento para erros de domínio
      message = exception.message;
      context = exception.context;
      stackTrace = exception.stack;
      details = exception.details;

      errorResponse.message = message;
    } else if (exception instanceof Error) {
      // Tratamento para erros genéricos (e.g., TypeError, ReferenceError)
      message = exception.message;
      context = 'InstanceError';
      stackTrace = exception.stack;

      errorResponse.message = message;
    } else {
      // Fallback para qualquer outro tipo de exceção
      message = (exception as any).message || 'Error Unhandled';
      stackTrace = (exception as any).stack || String(exception);
      context = 'Error Unhandled';
      errorResponse.message = message;
    }

    this.loggerService.error(
      `[${statusCode}] [Microservice-${this.module}] context=${context} - ${message}`,
      {
        statusCode,
        context,
        message,
        module: this.module,
        details,
        pattern,
        stackTrace,
      },
    );

    return throwError(() => new RpcException(errorResponse));
  }
}
