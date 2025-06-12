import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { render } from '@react-email/render';
import * as nodemailer from 'nodemailer';
import mailConfig from 'src/config/mail.config';

interface SendMailConfiguration {
  email: string;
  subject: string;
  text?: string;
  template: any;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,
  ) {
    this.transporter = nodemailer.createTransport(
      {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
      },
      {
        from: {
          name: this.config.fromName,
          address: this.config.fromAddress,
        },
      },
    );
  }

  private generateEmail = (template: any) => {
    return render(template);
  };

  async sendMail({ email, subject, template }: SendMailConfiguration) {
    const html = await this.generateEmail(template);

    await this.transporter.sendMail({
      to: email,
      subject,
      html,
    });
  }
}
