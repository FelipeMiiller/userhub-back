import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IncomingWebhook } from '@slack/webhook';

@Injectable()
export class SlackLoggerService {
  private webhook: IncomingWebhook | null = null;

  constructor(private configService: ConfigService) {
    const { url, defaults } = this.configService.get('slack');
    if (url) {
      this.webhook = new IncomingWebhook(url, defaults);
    }
  }

  async send(message: string, meta?: Record<string, unknown>) {
    if (!this.webhook) return;

    // Campos essenciais
    const context = meta?.context || 'Backend';
    const level = meta?.level || 'INFO';
    const environment = meta?.environment || this.configService.get('app.environment');
    const userId = meta?.userId || 'Desconhecido';
    const httpMethod = meta?.httpMethod || 'Desconhecido';
    const path = meta?.path || 'Desconhecido';
    const timestamp = meta?.timestamp
      ? new Date(meta.timestamp as string).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        })
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Header e seção principal
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `[${level}] ${context}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Mensagem:* ${message}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Método:* ${httpMethod}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Path:* ${path}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            meta?.userId ? `*Usuário:* ${meta.userId}` : null,
            meta?.environment ? `*Ambiente:* ${environment}` : null,
            `*Data/Hora:* ${timestamp}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      },
    ];

    // Stack trace (se houver)
    if (meta?.stackTrace) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Stack Trace:*\n\`\`\`\n${String(meta.stackTrace).slice(0, 3900)}\n\`\`\``,
        },
      });
    }

    // Payload bruto (se houver)
    if (meta?.rawError) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Raw Error:*\n\`\`\`\n${String(meta.rawError).slice(0, 3900)}\n\`\`\``,
        },
      });
    }

    await this.webhook.send({
      text: `[${level}] ${context}: ${message}`,
      blocks,
    });
  }
}
