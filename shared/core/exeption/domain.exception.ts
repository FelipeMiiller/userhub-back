export class DomainException extends Error {
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
