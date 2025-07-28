import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpClientModule } from 'shared/modules/http-client/http-client.module';
import ntfyConfig from './config';
import { PushNotificationService } from './core/push-notification.service';

@Module({
  imports: [ConfigModule.forFeature(ntfyConfig), HttpClientModule],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
