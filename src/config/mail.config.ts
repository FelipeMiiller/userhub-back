import { registerAs } from '@nestjs/config';

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
}

export default registerAs(
  'mail',
  (): MailConfig => ({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT, 10) || 465,
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    fromName: process.env.MAIL_FROM_NAME || 'UserHub',
    fromAddress: process.env.MAIL_FROM_ADDRESS || '',
  }),
);
