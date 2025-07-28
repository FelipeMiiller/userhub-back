import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IncomingWebhook } from '@slack/webhook';
import { LoggerConfig } from '../config';

interface Metadata {
  context?: string;
  idempotency?: string;
  level?: string;
  userId?: string;
  timestamp?: string;
  statusCode?: number;
  message?: string;
  module?: string;
  details?: Record<string, string>;
  pattern?: string;
  stackTrace?: string;
  path?: string;
  httpMethod?: string;
}

@Injectable()
export class SlackLoggerService {
  private webhook: IncomingWebhook | null = null;

  constructor(private configService: ConfigService) {
    const { url, defaults } = this.configService.get<LoggerConfig>('logger').slack;
    if (url) {
      this.webhook = new IncomingWebhook(url, defaults);
    }
  }

  private buildBlocks(message: string, metadata: Metadata): any[] {
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `[${metadata.level}] ${metadata.context} - ${metadata.module}`,
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
          text: `*Método:* ${metadata.httpMethod || 'Desconhecido'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Método:* ${metadata.httpMethod || 'Desconhecido'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Path:* ${metadata.path || 'Desconhecido'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Pattern:* ${metadata.pattern || 'Desconhecido'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            metadata.userId ? `*Usuário:* ${metadata.userId}` : null,
            `*Ambiente:* ${process.env.NODE_ENV}`,
            `*Data/Hora:* ${metadata.timestamp || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      },
    ];
    if (metadata.details && typeof metadata.details === 'object') {
      let detailsText = '*Details:*\n';
      for (const [key, value] of Object.entries(metadata.details)) {
        detailsText += `• *${key}:* ${value}\n`;
      }
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: detailsText,
        },
      });
    }
    if (metadata.stackTrace) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Stack Trace:*
\`\`\`
${metadata.stackTrace.slice(0, 3900)}
\`\`\``,
        },
      });
    }

    return blocks;
  }

  async send(message: string, metadata: Metadata) {
    if (!this.webhook) return;
    metadata = metadata || {};
    try {
      await this.webhook.send({
        text: `[${metadata.level}] ${metadata.context} - ${metadata.module}: ${message}`,
        blocks: this.buildBlocks(message, metadata),
      });
    } catch (error) {
      console.error('Failed to send to Slack', {
        error: error.message,
        context: metadata.context,
        message,
        stackTrace: metadata.stackTrace,
        details: metadata.details,
      });
    }
  }
}
