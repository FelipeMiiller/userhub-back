import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './domain/mail.service';

import mailConfig from '../../config/mail.config';
import { EmailPreviewController } from './http/email-preview.controller';

@Module({
  imports: [ConfigModule.forFeature(mailConfig)],
  controllers: [EmailPreviewController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
