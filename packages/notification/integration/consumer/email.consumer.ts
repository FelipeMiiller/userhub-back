import { Injectable } from '@nestjs/common';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

import {
  EmailNotificationPayload,
  EmailTemplates,
} from 'shared/modules/integration/notifications/email.notification';
import {
  NotificationExchange,
  NotificationQueue,
} from 'shared/modules/integration/notifications/notification.types';
import { LoggerService } from 'shared/modules/loggers/domain/logger.service';
import { MailService } from 'packages/notification/mail/core/mail.service';

@Injectable()
export class EmailConsumer {
  constructor(
    private readonly mailService: MailService,
    private readonly loggerService: LoggerService,
  ) {}

  @RabbitSubscribe({
    exchange: NotificationExchange.DIRECT_EXCHANGE,
    routingKey: NotificationQueue.NOTIFICATIONS_EMAIL_QUEUE,
    queue: NotificationQueue.NOTIFICATIONS_EMAIL_QUEUE,
    queueOptions: {
      durable: true, // Fila persistente
    },
    // Configuração para acknowledgment manual
    allowNonJsonMessages: false,
  })
  public async handleEmailNotification(msg: EmailNotificationPayload) {
    const { template, payload } = msg;

    this.loggerService.info(`📧 Processando mensagem de email: ${template} para ${payload.email}`);

    try {
      switch (template) {
        case EmailTemplates.WELCOME_EMAIL:
          await this.mailService.sendWelcomeEmail(payload.email, payload.name);
          this.loggerService.info(`✅ E-mail de boas vindas enviado para: ${payload.email}`);
          break;

        case EmailTemplates.PASSWORD_RESET:
          // await this.mailService.sendPasswordResetEmail(payload.email, payload.resetToken, payload.name);
          this.loggerService.info(
            `✅ E-mail de recuperação de senha enviado para: ${payload.email}`,
          );
          break;

        case EmailTemplates.ACCOUNT_ACTIVATION:
          // await this.mailService.sendAccountActivationEmail(payload.email, payload.activationToken, payload.name);
          this.loggerService.info(`✅ E-mail de ativação de conta enviado para: ${payload.email}`);
          break;

        default:
          this.loggerService.error(`❌ Template ${template} não encontrado`, msg);
          // Para templates desconhecidos, rejeitamos a mensagem sem requeue
          return new Nack(false);
      }

      // ✅ Sucesso: mensagem será automaticamente acknowledged
      this.loggerService.info(`✅ Mensagem processada com sucesso: ${template}`);
    } catch (error) {
      this.loggerService.error(`❌ Erro ao processar mensagem: ${error.message}`, {
        stack: error.stack,
        template,
        payload,
      });

      // ❌ Erro: rejeita a mensagem e recoloca na fila para retry
      // true = requeue (tentar novamente), false = descartar
      return new Nack(true);
    }
  }
}
