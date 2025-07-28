import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'shared/modules/loggers/core/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.loggerService.contextName = LoggingInterceptor.name;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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
        const duration = `${ms}ms`;
        const isSlow = ms > this.configService.get('app.maxRequestDurationMs');

        this.loggerService.info(`Request completed${isSlow ? ' (SLOW)' : ''}`, {
          method,
          url,
          ip,
          duration,
          ...(isSlow && { warning: 'Request exceeded maximum duration' }),
        });

        if (isSlow) {
          this.loggerService.warn(
            `Slow request detected`,
            {
              method,
              url,
              duration,
              threshold: `${this.configService.get('app.maxRequestDurationMs')}ms`,
            },
            { slack: true },
          );
        }
      }),
    );
  }
}
