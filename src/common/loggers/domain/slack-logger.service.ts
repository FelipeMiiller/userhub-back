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

  private buildBlocks(message: string, meta: Record<string, unknown>): any[] {
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `[${meta.level}] ${meta.context}`,
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
          text: `*Método:* ${meta.httpMethod || 'Desconhecido'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Path:* ${meta.path || 'Desconhecido'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            meta.userId ? `*Usuário:* ${meta.userId}` : null,
            meta.environment ? `*Ambiente:* ${meta.environment}` : null,
            `*Data/Hora:* ${meta.timestamp || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      },
    ];

    if (meta.stackTrace) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Stack Trace:*
\`\`\`
${String(meta.stackTrace).slice(0, 3900)}
\`\`\``,
        },
      });
    }

    if (meta.rawError) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Raw Error:*
\`\`\`
${String(meta.rawError).slice(0, 3900)}
\`\`\``,
        },
      });
    }

    return blocks;
  }

  async send(message: string, meta?: Record<string, unknown>) {
    if (!this.webhook) return;
    meta = meta || {};
    try {
      await this.webhook.send({
        text: `[${meta.level}] ${meta.context}: ${message}`,
        blocks: this.buildBlocks(message, meta),
      });
    } catch (error) {
      // If Slack fails, just log locally and continue
      console.error('Failed to send to Slack', {
        error: error.message,
        context: meta.context,
        message,
        meta,
      });
    }
  }
}
