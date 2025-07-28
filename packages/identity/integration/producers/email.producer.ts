import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  EmailNotificationPayload,
  EmailTemplates,
} from 'shared/modules/integration/notifications/email.notification';
import {
  NotificationExchange,
  NotificationQueue,
} from 'shared/modules/integration/notifications/notification.types';
import { LoggerService } from 'shared/modules/loggers';

@Injectable()
export class EmailProducer {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly loggerService: LoggerService,
  ) {}
  private async sendEmailNotification(payload: EmailNotificationPayload): Promise<void> {
    try {
      await this.amqpConnection.publish(
        NotificationExchange.DIRECT_EXCHANGE,
        NotificationQueue.NOTIFICATIONS_EMAIL_QUEUE,
        payload,
        {
          persistent: true,
          timestamp: Date.now(),
        },
      );

      this.loggerService.info('Email notification sent to queue:', {
        payload: payload.payload,
        template: payload.template,
      });
    } catch (error) {
      this.loggerService.error('Failed to send email notification:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const message: EmailNotificationPayload = {
      template: EmailTemplates.WELCOME_EMAIL,
      payload: {
        email: userEmail,
        name: userName,
      },
    };

    await this.sendEmailNotification(message);
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
    userName: string,
  ): Promise<void> {
    const message: EmailNotificationPayload = {
      template: EmailTemplates.PASSWORD_RESET,
      payload: {
        email: userEmail,
        resetToken,
        name: userName,
      },
    };

    await this.sendEmailNotification(message);
  }

  async sendAccountActivationEmail(
    userEmail: string,
    activationToken: string,
    userName: string,
  ): Promise<void> {
    const message: EmailNotificationPayload = {
      template: EmailTemplates.ACCOUNT_ACTIVATION,
      payload: {
        email: userEmail,
        activationToken,
        name: userName,
      },
    };

    await this.sendEmailNotification(message);
  }
}
