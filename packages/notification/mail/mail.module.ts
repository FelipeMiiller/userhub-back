import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import MailConfig from './config';
import { MailService } from './core/mail.service';

@Module({
  imports: [ConfigModule.forFeature(MailConfig)],
  controllers: [],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
