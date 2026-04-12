import { DomainException } from '@hub/shared-lib/core/exeption/domain.exception';

export class MailDomainException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}
