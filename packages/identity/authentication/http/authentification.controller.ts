import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/response/user-response.dto';
import { RecoveryPasswordRequestDto } from './dto/request/recovery-password.dto';
import { ChangePasswordRequestDto } from './dto/request/change-password.dto';
import { Public, JwtAuthGuard, Login, Payload } from '@hub/shared-module/authorization';
import { LoggerService } from '@hub/shared-module/loggers';
import { AuthenticationService } from '../core/services/auth.service';
import { LocalUserAuthGuard } from '../core/guards/localUser-auth.guard';
import { GoogleUserAuthGuard } from '../core/guards/googleUser-auth.guard';
import { RefreshAuthGuard } from '../core/guards/refresh-auth.guard';
import { signUpRequestDto } from './dto/request/signup-user.dto';
import { SigninRequestDto } from './dto/request/signin-users.dto';
import { ResendVerificationDto } from './dto/request/resend-verification.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { CreateOnboardingTenantDto } from './dto/request/create-onboarding-tenant.dto';
import { Account } from '../../persistence/entities/accounts.entities';
import { AccountService } from '../core/services/account.service';

type AuthRequest = Omit<Request, 'user'> & { user: Payload };
type AccountRequest = Omit<Request, 'user'> & { user: Account };
type RefreshRequest = Omit<Request, 'user'> & { user: Omit<Login, 'accessToken'> };

@ApiTags('auth')
@Controller('auth')
export class AuthentificationController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = AuthentificationController.name;
  }

  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  @ApiBody({ type: signUpRequestDto })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Post('signup')
  async create(@Body() userDto: signUpRequestDto): Promise<UserResponseDto> {
    const user = await this.authService.signUp({
      ...userDto,
    });

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('onboarding/tenant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria tenant e vincula ao account autenticado (etapa de onboarding)' })
  @ApiBody({ type: CreateOnboardingTenantDto })
  @ApiResponse({ status: 201, description: 'Tenant criado e vinculado ao account' })
  @ApiResponse({ status: 404, description: 'Account não encontrada' })
  @ApiResponse({ status: 409, description: 'Slug já está em uso' })
  async createOnboardingTenant(@Req() req: AuthRequest, @Body() dto: CreateOnboardingTenantDto) {
    const { sub }: Payload = req['user'];
    return this.accountService.createOnboardingTenant({
      AccountId: sub,
      Name: dto.Name,
      Slug: dto.Slug,
    });
  }

  @ApiOperation({ summary: 'Autentica um usuário com e-mail e senha' })
  @ApiBody({ type: SigninRequestDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @Public()
  @UseGuards(LocalUserAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Req() req: AccountRequest): Promise<Login> {
    return this.authService.signIn(req['user']);
  }

  @ApiOperation({ summary: 'Solicita a recuperação de senha' })
  @ApiBody({ type: RecoveryPasswordRequestDto })
  @ApiResponse({
    status: 202,
    description: 'Se o e-mail estiver cadastrado, uma nova senha será enviada',
  })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async ForgotPassword(
    @Body() recoveryDto: RecoveryPasswordRequestDto,
  ): Promise<{ message: string }> {
    await this.authService.recoveryPassword(recoveryDto.Email);
    return {
      message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
    };
  }

  @ApiOperation({ summary: 'Redefine a senha do usuário' })
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiResponse({
    status: 202,
    description: 'Senha redefinida com sucesso',
  })
  @Public()
  @Post('change-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async ChangePassword(@Body() changeDto: ChangePasswordRequestDto): Promise<{ message: string }> {
    await this.authService.changePassword(changeDto);
    return {
      message: 'Senha alterada com sucesso.',
    };
  }

  @ApiOperation({ summary: 'Inicia o fluxo de autenticação via Google OAuth' })
  @ApiResponse({ status: 302, description: 'Redireciona para o Google' })
  @Public()
  @UseGuards(GoogleUserAuthGuard)
  @Get('google/signin')
  googleLoginUser(): void {
    return;
  }

  @ApiOperation({ summary: 'Callback do Google OAuth — redireciona ao frontend com tokens' })
  @ApiResponse({ status: 302, description: 'Redireciona ao frontend com accessToken e refreshToken' })
  @Public()
  @UseGuards(GoogleUserAuthGuard)
  @Get('google/callback')
  async googleCallbackUser(@Req() req: AccountRequest, @Res() res: Response) {
    const response = await this.authService.signIn(req['user']);
    res.redirect(
      `${this.configService.get('googleOAuth.callbackFrontUser')}?accessToken=${response.accessToken}&refreshToken=${response.refreshToken}`,
    );
  }

  @ApiOperation({ summary: 'Renova o accessToken usando o refreshToken' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'RefreshToken inválido ou expirado' })
  @Public()
  @ApiBearerAuth()
  @UseGuards(RefreshAuthGuard)
  @Post('refreshToken')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: RefreshRequest): Promise<Login> {
    return this.authService.refreshToken(req['user']);
  }

  @ApiOperation({ summary: 'Encerra a sessão do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Sessão encerrada com sucesso' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async logoutUser(@Req() req: AuthRequest) {
    const token = (req.headers as Record<string, string>)?.authorization?.split(' ')[1];
    return this.authService.signOutUser(req['user'].sub, token);
  }

  @ApiQuery({ name: 'token', type: String, description: 'Token de verificação recebido por e-mail' })
  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirma e-mail através de token de verificação' })
  @ApiResponse({ status: 200, description: 'E-mail verificado com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async verifyEmail(@Query('token') token: string): Promise<{ message: string }> {
    await this.authService.verifyEmail(token);
    return { message: 'E-mail verificado com sucesso' };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenvia e-mail de verificação' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 200, description: 'E-mail de verificação reenviado' })
  async resendVerificationEmail(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    await this.authService.resendVerificationEmail(dto.Email);
    return { message: 'E-mail de verificação enviado' };
  }
}
