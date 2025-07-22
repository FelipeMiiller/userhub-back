import { registerAs } from '@nestjs/config';
import { IsBoolean, IsInt, IsString, IsUrl, Max, Min } from 'class-validator';
import validateConfig from 'shared/lib/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  MAIL_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  MAIL_PORT: number;

  @IsBoolean()
  MAIL_SECURE: boolean;

  @IsString()
  MAIL_USER: string;

  @IsString()
  MAIL_PASSWORD: string;

  @IsString()
  MAIL_FROM_NAME: string;

  @IsString()
  MAIL_FROM_ADDRESS: string;

  @IsUrl({ require_tld: false })
  FRONTEND_DOMAIN: string;
}

export interface MailConfig {
  frontendDomain: string;
  transport: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    address: string;
  };
}
export default registerAs('mail', (): MailConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    frontendDomain: process.env.FRONTEND_DOMAIN,
    transport: {
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    },
    from: {
      name: process.env.MAIL_FROM_NAME,
      address: process.env.MAIL_FROM_ADDRESS,
    },
  };
});
