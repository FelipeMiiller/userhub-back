import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoggerService } from '../../modules/loggers/core/logger.service';
import { DomainException } from '../exeption/domain.exception';

type ErrorResponse = {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | object;
  httpMethod: string;
};
type ErrorDetails = {
  context: string;
  idempotency?: string;
  httpMethod?: string;
  path?: string;
  stackTrace?: string;
  [key: string]: string | undefined;
};

@Catch()
export class ServerExceptionFilter implements ExceptionFilter {
  constructor(
    public readonly module: string,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = 'ServerExceptionFilter';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const httpMethod = request.method;
    const path = request.url;

    let statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal Server Error';
    let details: Record<string, any> = {};
    let context: string | undefined = request.context ? request.context : 'Unknown';
    let stackTrace: string | undefined = (exception as any)?.stack;
    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      message,
      httpMethod,
      path: request.url,
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
        details = responseBody;
        errorResponse.message = (responseBody as any).message || 'Http Exception';
      }
    }
    if (exception instanceof DomainException) {
      // Tratamento para erros de domínio
      message = exception.message;
      context = exception.context;

      stackTrace = exception.stack;
      details = exception.details;
      errorResponse.message = 'Internal Server Error';
    } else if (exception instanceof Error) {
      // Tratamento para erros genéricos (e.g., TypeError, ReferenceError)
      message = exception.message;
      context = 'InstanceError';
      stackTrace = exception.stack;

      errorResponse.message = 'Internal Server Error';
    } else {
      // Fallback para qualquer outro tipo de exceção
      message = (exception as any).message || 'Error Unhandled';
      stackTrace = (exception as any).stack || String(exception);
      context = 'Error Unhandled';
      errorResponse.message = 'Internal Server Error';
    }

    this.loggerService.error(
      `[${errorResponse.statusCode}] [Service-${this.module}]  ${request.method} ${request.url} - ${errorResponse.message}`,
      {
        statusCode: errorResponse.statusCode,
        context: context,
        message: errorResponse.message,
        module: this.module,
        path: request.url,
        httpMethod: request.method,
        details,
        stackTrace: stackTrace,
      },
    );

    response
      .status(errorResponse.statusCode || HttpStatus.INTERNAL_SERVER_ERROR)
      .json(errorResponse);
  }
}
