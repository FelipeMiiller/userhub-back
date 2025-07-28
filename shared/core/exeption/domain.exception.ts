export class DomainException extends Error {
  public readonly code?: string;
  public readonly details?: Record<string, string>;
  public readonly context: string;

  constructor(message: string, details?: Record<string, string>) {
    super(message);
    this.context = this.constructor.name;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
