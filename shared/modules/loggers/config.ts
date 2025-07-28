import { registerAs } from '@nestjs/config';
import { IncomingWebhookDefaultArguments } from '@slack/webhook';
import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import validateConfig from 'shared/lib/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsUrl()
  @IsOptional()
  SLACK_WEBHOOK_URL: string;

  @IsString()
  @IsOptional()
  SLACK_CHANNEL: string;

  @IsString()
  @IsOptional()
  SLACK_USERNAME: string;

  @IsString()
  @IsOptional()
  SLACK_ICON_EMOJI: string;
}

export type LoggerConfig = {
  slack: { url: string; defaults?: IncomingWebhookDefaultArguments };
};
export default registerAs('logger', (): LoggerConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    slack: {
      url: process.env.SLACK_WEBHOOK_URL,
      defaults: {
        channel: process.env.SLACK_CHANNEL,
        username: process.env.SLACK_USERNAME,
        icon_emoji: process.env.SLACK_ICON_EMOJI,
      },
    },
  };
});
