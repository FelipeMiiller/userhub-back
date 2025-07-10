import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';
import { MailService } from '../domain/mail.service';
import { Public } from 'src/modules/auth/domain/decorator/public.decorator';

@ApiTags('Email Templates')
@Controller('email-preview')
export class EmailPreviewController {
  constructor(private readonly mailService: MailService) {}

  @ApiOperation({
    summary: 'Visualizar template de e-mail de boas-vindas',
    description:
      'Retorna o HTML renderizado do template de e-mail de boas-vindas para visualização.',
  })
  @ApiResponse({
    status: 200,
    description: 'HTML renderizado do template de boas-vindas',
    content: {
      'text/html': {
        schema: {
          type: 'string',
          example: '<html>...</html>',
        },
      },
    },
  })
  @ApiProduces('text/html')
  @Public()
  @Get('welcome')
  async previewWelcomeEmail(@Res() res: Response): Promise<void> {
    const templateName = 'welcome';
    const context = {
      userFirstname: 'João Silva',
      siteUrl: 'http://localhost:3000',
    };

    const html = await this.mailService.compileTemplate(templateName, context);
    res.set('Content-Type', 'text/html');
    res.send(html);
  }

  @ApiOperation({
    summary: 'Visualizar template de e-mail de redefinição de senha',
    description:
      'Retorna o HTML renderizado do template de e-mail de redefinição de senha para visualização.',
  })
  @ApiResponse({
    status: 200,
    description: 'HTML renderizado do template de redefinição de senha',
    content: {
      'text/html': {
        schema: {
          type: 'string',
          example: '<html>...</html>',
        },
      },
    },
  })
  @ApiProduces('text/html')
  @Public()
  @Get('reset-password')
  async previewResetPasswordEmail(@Res() res: Response): Promise<void> {
    const templateName = 'reset-password';
    const context = {
      userFirstname: 'João Silva',
      userEmail: 'joao@example.com',
      newPassword: 'NovaSenha123!',
      siteUrl: 'http://localhost:3000',
    };

    const html = await this.mailService.compileTemplate(templateName, context);
    res.set('Content-Type', 'text/html');
    res.send(html);
  }
}
