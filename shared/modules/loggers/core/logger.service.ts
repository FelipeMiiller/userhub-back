/* eslint-disable no-console */
import { createLogger, format, Logger, transports } from 'winston';
import { Injectable, Optional } from '@nestjs/common';

import { SlackLoggerService } from './slack-logger.service';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
  AUDIT = 'audit',
}

interface LogMetadata {
  context: string;
  idempotency: string;
  statusCode?: number;
  message?: string;

  details?: Record<string, string>;
  pattern?: string;
  stackTrace?: string;
  path?: string;
  httpMethod?: string;
  module?: string;
}

@Injectable()
export class LoggerService {
  private _idempotencyKey: string;
  private _contextName = 'LoggerService';
  private readonly logger: Logger = createLogger();

  constructor(@Optional() private readonly slackLoggerService?: SlackLoggerService) {
    this.logger.configure({
      transports: [
        this.logTransportConsole(),
        //  this.logTransportFile(),
        // this.logTransportCombined(),
      ],
      exitOnError: false,
    });
  }

  private logTransportConsole() {
    return new transports.Console({
      handleExceptions: true,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
      ),
    });
  }

  //private logTransportFile() {
  //return new transports.File({
  //  filename: 'logs/error.log',
  //  level: 'error',
  //  format: format.combine(
  //    format.timestamp(),
  //    format.errors({ stack: true }),
  //    format.splat(),
  //    format.json(),
  //  ),
  //});
  // }

  // private logTransportCombined() {
  //    return new transports.File({
  //     filename: 'logs/combined.log',
  //     format: format.combine(
  //       format.timestamp(),
  //       format.errors({ stack: true }),
  //       format.splat(),
  //       format.json(),
  //     ),
  //   });
  // }

  set idempotencyKey(idempotencyKey: string) {
    this._idempotencyKey = idempotencyKey;
  }

  get idempotencyKey(): string {
    return this._idempotencyKey;
  }

  set contextName(contextName: string) {
    this._contextName = contextName;
  }

  get contextName(): string {
    return this._contextName;
  }

  private async createSlackLog(
    level: string,
    message: string,
    context: string,
    metadata?: LogMetadata,
    userId?: string,
  ): Promise<void> {
    if (!this.slackLoggerService) return;
    try {
      await this.slackLoggerService.send(message, {
        level,
        context,
        ...(metadata || {}),
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.log('Failed to send log to Slack:', error);
    }
  }

  error(
    message: string,
    meta?: Omit<LogMetadata, 'idempotency'>,
    options: { slack?: boolean; userId?: string } = { slack: true, userId: undefined },
  ): void {
    const metadata: LogMetadata = {
      context: this._contextName,
      idempotency: this._idempotencyKey,
      ...(meta || {}),
    };

    this.logger.error({
      level: LogLevel.ERROR,
      message,
      meta: metadata,
    });

    if (options.slack) {
      this.createSlackLog(LogLevel.ERROR, message, this._contextName, metadata, options.userId);
    }
  }

  warn(
    message: string,
    meta?: Omit<LogMetadata, 'idempotency'>,
    options: { slack?: boolean; userId?: string } = {},
  ): void {
    const metadata: LogMetadata = {
      context: this._contextName,
      idempotency: this._idempotencyKey,
      ...(meta || {}),
    };

    this.logger.warn({
      level: LogLevel.WARN,
      message,
      meta: metadata,
    });

    if (options.slack) {
      this.createSlackLog(LogLevel.WARN, message, this._contextName, metadata, options.userId);
    }
  }

  info(
    message: string,
    meta?: Omit<LogMetadata, 'idempotency'>,
    options: { slack?: boolean; userId?: string } = {},
  ): void {
    const metadata: LogMetadata = {
      context: this._contextName,
      idempotency: this._idempotencyKey,
      ...(meta || {}),
    };

    this.logger.info({
      level: LogLevel.INFO,
      message,
      meta: metadata,
    });

    if (options.slack) {
      this.createSlackLog(LogLevel.INFO, message, this._contextName, metadata, options.userId);
    }
  }

  debug(
    message: string,
    meta?: Omit<LogMetadata, 'idempotency'>,
    options: { slack?: boolean; userId?: string } = {},
  ): void {
    const metadata: LogMetadata = {
      context: this._contextName,
      idempotency: this._idempotencyKey,
      ...(meta || {}),
    };

    this.logger.debug({
      level: LogLevel.DEBUG,
      message,
      meta: metadata,
    });

    if (options.slack) {
      this.createSlackLog(LogLevel.DEBUG, message, this._contextName, metadata, options.userId);
    }
  }

  audit(message: string, meta?: Omit<LogMetadata, 'idempotency'>, userId?: string): void {
    const metadata: LogMetadata = {
      context: this._contextName,
      idempotency: this._idempotencyKey,
      ...(meta || {}),
    };

    this.logger.data({ message, meta: metadata, userId });
  }
}
