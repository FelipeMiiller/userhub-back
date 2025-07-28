import { registerAs } from '@nestjs/config';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import validateConfig from 'shared/lib/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsUrl()
  @IsOptional()
  NTFY_URL: string;

  @IsString()
  @IsOptional()
  NTFY_USER: string;

  @IsString()
  @IsOptional()
  NTFY_PASS: string;

  @IsString()
  @IsOptional()
  NTFY_DEFAULT_TOPIC: string;
}

export interface NtfyConfig {
  url: string;
  user?: string;
  pass?: string;
  defaultTopic: string;
}

export default registerAs('ntfy', (): NtfyConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    url: process.env.NTFY_URL || 'https://ntfy.sh',
    user: process.env.NTFY_USER,
    pass: process.env.NTFY_PASS,
    defaultTopic: process.env.NTFY_DEFAULT_TOPIC || 'userhub-notifications',
  };
});
