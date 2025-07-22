import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

// Interface para padronizar a resposta de erro
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  stack?: string;
}

@Catch()
export class MicroserviceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToRpc();
    const data = ctx.getData();
    const pattern = ctx.getContext();

    // Log do erro para debugging
    this.logger.error(`Microservice Exception: ${exception.message}`, {
      pattern: pattern,
      data: data,
      stack: exception.stack,
      exception: exception.constructor.name,
    });

    let errorResponse: ErrorResponse;

    if (exception instanceof RpcException) {
      // Erro específico de RPC
      errorResponse = this.handleRpcException(exception, pattern);
    } else if (exception instanceof HttpException) {
      // Conversão de HttpException para RpcException
      errorResponse = this.handleHttpException(exception, pattern);
    } else if (exception.name === 'ValidationError' || exception.name === 'ValidatorError') {
      // Erros de validação
      errorResponse = this.handleValidationError(exception, pattern);
    } else if (exception.name === 'MongoError' || exception.name === 'CastError') {
      // Erros de banco de dados MongoDB
      errorResponse = this.handleDatabaseError(exception, pattern);
    } else if (exception.code === 'ECONNREFUSED' || exception.code === 'ENOTFOUND') {
      // Erros de conexão
      errorResponse = this.handleConnectionError(exception, pattern);
    } else {
      // Erro genérico/não tratado
      errorResponse = this.handleGenericError(exception, pattern);
    }

    // Retorna um Observable com o erro formatado
    return throwError(() => new RpcException(errorResponse));
  }

  private handleRpcException(exception: RpcException, pattern: any): ErrorResponse {
    const error = exception.getError() as any;

    return {
      statusCode: error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Microservice RPC error',
      error: error.error || 'RpcException',
      timestamp: new Date().toISOString(),
      path: pattern?.cmd || pattern,
    };
  }

  private handleHttpException(exception: HttpException, pattern: any): ErrorResponse {
    const status = exception.getStatus();
    const response = exception.getResponse() as any;

    return {
      statusCode: status,
      message: response.message || exception.message,
      error: response.error || exception.name,
      timestamp: new Date().toISOString(),
      path: pattern?.cmd || pattern,
    };
  }

  private handleValidationError(exception: any, pattern: any): ErrorResponse {
    const message = this.extractValidationMessages(exception);

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: message,
      error: 'ValidationError',
      timestamp: new Date().toISOString(),
      path: pattern?.cmd || pattern,
    };
  }

  private handleDatabaseError(exception: any, pattern: any): ErrorResponse {
    let message = 'Database operation failed';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception.code === 11000) {
      // Duplicate key error
      message = 'Duplicate entry found';
      statusCode = HttpStatus.CONFLICT;
    } else if (exception.name === 'CastError') {
      message = 'Invalid data format';
      statusCode = HttpStatus.BAD_REQUEST;
    }

    return {
      statusCode: statusCode,
      message: message,
      error: 'DatabaseError',
      timestamp: new Date().toISOString(),
      path: pattern?.cmd || pattern,
    };
  }

  private handleConnectionError(exception: any, pattern: any): ErrorResponse {
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'External service unavailable',
      error: 'ConnectionError',
      timestamp: new Date().toISOString(),
      path: pattern?.cmd || pattern,
    };
  }

  private handleGenericError(exception: any, pattern: any): ErrorResponse {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Internal server error',
      error: exception.name || 'InternalError',
      timestamp: new Date().toISOString(),
      path: pattern?.cmd || pattern,
      ...(process.env.NODE_ENV === 'development' && { stack: exception.stack }),
    };
  }

  private extractValidationMessages(exception: any): string {
    if (exception.errors) {
      const messages = Object.values(exception.errors)
        .map((err: any) => err.message)
        .join(', ');
      return messages;
    }
    return exception.message || 'Validation failed';
  }
}
