import { Module } from '@nestjs/common';
import { PushNotificationModule } from './push-notification/push-notification.module';
import { MailModule } from './mail/mail.module';
import { NotificationIntegrationModule } from './integration/notification.integration';
import { LoggerModule } from 'shared/modules/loggers/logger.module';

@Module({
  imports: [MailModule, PushNotificationModule, NotificationIntegrationModule, LoggerModule],
})
export class NotificationModule {}
