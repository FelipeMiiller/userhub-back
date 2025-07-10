import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import mailConfig from 'src/config/mail.config';

interface SendMailConfiguration {
  email: string;
  subject: string;
  template: string; // Nome do arquivo do template (sem a extensão)
  context: Record<string, any>; // Dados para o template
  text?: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly templatesDir: string;

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,
  ) {
    this.templatesDir = path.join(process.cwd(), 'src/modules/mail/domain/templates');

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

  async compileTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      return template(context);
    } catch (error) {
      console.error(`Erro ao compilar o template ${templateName}:`, error);
      throw new Error(`Falha ao compilar o template de email: ${error.message}`);
    }
  }

  async sendMail({ email, subject, template, context, text }: SendMailConfiguration) {
    try {
      const html = await this.compileTemplate(template, context);

      await this.transporter.sendMail({
        to: email,
        subject,
        html,
        text: text || this.generatePlainText(html),
      });
    } catch (error) {
      throw new Error(`Falha ao enviar email: ${error.message}`);
    }
  }

  private generatePlainText(html: string): string {
    // Remove tags HTML e espaços em branco extras
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
