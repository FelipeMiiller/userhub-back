//https://docs.ntfy.sh/publish/
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClient } from 'shared/modules/http-client/client/http.client';
import { NtfyConfig } from '../config';
import { LoggerService } from 'shared/modules/loggers';

export interface NtfyOptions {
  topic?: string;
  title?: string;
  message: string;
  tags?: string;
  priority?: number;
  click?: string;
  attachUrl?: string;
}

export interface SendPushNotificationOptions {
  topic: string;
  message: string;
  title?: string;
  tags?: string;
  priority?: number;
  click?: string;
  attachUrl?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly config: NtfyConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpClient: HttpClient,
    private readonly logger: LoggerService,
  ) {
    this.config = this.configService.get<NtfyConfig>('ntfy');
  }

  async sendPushNotification(options: SendPushNotificationOptions): Promise<void> {
    const { topic, message, title, tags, priority, click, attachUrl } = options;

    const url = `${this.config.url}/${topic}`;
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain',
    };

    // Add optional headers based on ntfy.sh documentation
    if (title) headers['Title'] = title;
    if (tags) headers['Tags'] = tags;
    if (priority) headers['Priority'] = priority.toString();
    if (click) headers['Click'] = click;
    if (attachUrl) headers['Attach'] = attachUrl;

    // Add authentication if configured
    if (this.config.user && this.config.pass) {
      headers['Authorization'] =
        'Basic ' + Buffer.from(`${this.config.user}:${this.config.pass}`).toString('base64');
    }

    try {
      await this.httpClient.post(url, message, { headers });
      this.logger.info(`Push notification sent successfully to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to topic ${topic}:`, error);
      throw error;
    }
  }

  async sendUserAlert(userId: string, message: string, title?: string): Promise<void> {
    await this.sendPushNotification({
      topic: `user-${userId}`,
      message,
      title: title || 'UserHub Alert',
      tags: 'warning',
      priority: 4,
    });
  }

  async sendSystemNotification(message: string, title?: string): Promise<void> {
    await this.sendPushNotification({
      topic: this.config.defaultTopic,
      message,
      title: title || 'UserHub System',
      tags: 'information',
      priority: 3,
    });
  }

  async sendWelcomePushNotification(userId: string, name: string): Promise<void> {
    await this.sendPushNotification({
      topic: `user-${userId}`,
      message: `Olá ${name}! Bem-vindo ao UserHub. Sua conta foi criada com sucesso! 🎉`,
      title: 'Bem-vindo ao UserHub',
      tags: 'party,welcome',
      priority: 3,
    });
  }

  async sendPasswordResetNotification(userId: string, name: string): Promise<void> {
    await this.sendPushNotification({
      topic: `user-${userId}`,
      message: `Olá ${name}, sua senha foi redefinida com sucesso. Verifique seu email para mais detalhes.`,
      title: 'Senha Redefinida - UserHub',
      tags: 'key,security',
      priority: 4,
    });
  }
}
