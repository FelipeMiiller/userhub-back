import { DomainException } from './domain.exception';

export class NotFoundDomainException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}
