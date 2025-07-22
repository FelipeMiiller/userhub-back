import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import Handlebars from 'handlebars';
import { MailTemplates } from './constants/mail-templates.enum';
import { MailConfig } from '../config';
import { LoggerService } from 'shared/modules/loggers/domain/logger.service';
import { MailDomainException } from './excepition/mail-domain.exception';

interface SendMailConfiguration {
  email: string;
  subject: string;
  template: MailTemplates; // Nome do arquivo do template (sem a extensão)
  context: Record<string, any>; // Dados para o template
  text?: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly templatesDir: string;
  private readonly configMail: MailConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.configMail = this.configService.get<MailConfig>('mail');

    this.templatesDir = path.join(process.cwd(), 'packages/notification/mail/core/templates');

    this.transporter = nodemailer.createTransport(this.configMail.transport, {
      from: this.configMail.from,
    });
  }

  async compileTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = Handlebars.compile(templateSource);
      return template(context);
    } catch (error) {
      throw new MailDomainException(`Erro ao compilar template: ${error.message}`);
    }
  }

  async sendMail({ email, subject, template, context, text }: SendMailConfiguration) {
    try {
      const html = await this.compileTemplate(template, context);

      await this.transporter.sendMail({
        to: email,
        subject,
        html,
        text: text || html,
      });
    } catch (error) {
      throw new MailDomainException(`Falha ao enviar email: ${error.message}`);
    }
  }

  async sendResetPasswordEmail(email: string, name: string, newPassword: string) {
    return this.sendMail({
      email,
      subject: 'Nova Senha - UserHub',
      template: MailTemplates.RESET_PASSWORD,
      context: {
        userFirstname: name,
        newPassword,
        userEmail: email,
        frontendDomain: this.configMail.frontendDomain,
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    return this.sendMail({
      email,
      subject: 'Bem-vindo ao UserHub',
      template: MailTemplates.WELCOME,
      context: {
        userFirstname: name,
        frontendDomain: this.configMail.frontendDomain,
      },
    });
  }
}
