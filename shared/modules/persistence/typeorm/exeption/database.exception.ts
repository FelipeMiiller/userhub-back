import { DomainException } from 'shared/core/exeption/domain.exception';

export class DatabaseException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}
