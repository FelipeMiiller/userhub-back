import { DomainException } from 'shared/core/exeption/domain.exception';

export class MailDomainException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MailDomainException', details);
  }
}
