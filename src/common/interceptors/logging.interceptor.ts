import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from '../loggers/domain/logger.service';
import { Reflector } from '@nestjs/core';
import { SKIP_LOGGING_KEY } from './decorator/skip-logging.decorator';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly reflector: Reflector
  ) {
    this.loggerService.contextName = LoggingInterceptor.name;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipLogging = this.reflector.get<boolean>(
      SKIP_LOGGING_KEY,
      context.getHandler()
    );
    
    if (skipLogging) {
      return next.handle();
    }
    
    const req = context.switchToHttp().getRequest();
    const { method, url, ip } = req;
    const now = Date.now();

    this.loggerService.info(`Incoming request`, {
      method,
      url,
      ip,
    });

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        this.loggerService.info(`Request completed`, {
          method,
          url,
          ip,
          duration: `${ms}ms`,
        });
      }),
      catchError((err) => {
        const ms = Date.now() - now;
        this.loggerService.error(`Request failed`, {
          method,
          url,
          ip,
          duration: `${ms}ms`,
          error: err?.message,
        });
        throw err;
      }),
    );
  }
}
