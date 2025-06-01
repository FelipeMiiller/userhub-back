import { registerAs } from '@nestjs/config';
import { IncomingWebhookDefaultArguments } from '@slack/webhook';

export default registerAs(
  'slack',
  (): { url: string; defaults?: IncomingWebhookDefaultArguments } => {
    return {
      url: process.env.SLACK_WEBHOOK_URL,
      defaults: {
        channel: process.env.SLACK_CHANNEL,
        username: process.env.SLACK_USERNAME,
        icon_emoji: process.env.SLACK_ICON_EMOJI,
      },
    };
  },
);
