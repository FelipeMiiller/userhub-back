import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/response/user-response.dto';
import { RecoveryPasswordRequestDto } from './dto/request/recovery-password.dto';
import { ChangePasswordRequestDto } from './dto/request/change-password.dto';
import { UpdateMeRequestDto } from './dto/request/update-me.dto';
import { Public, JwtAuthGuard, Login, Payload } from '@hub/shared-module/authorization';
import { LoggerService } from '@hub/shared-module/loggers';
import { AuthenticationService } from '../core/services/auth.service';
import { LocalUserAuthGuard } from '../core/guards/localUser-auth.guard';
import { GoogleUserAuthGuard } from '../core/guards/googleUser-auth.guard';
import { RefreshAuthGuard } from '../core/guards/refresh-auth.guard';
import { signUpRequestDto } from './dto/request/signup-user.dto';
import { ResendVerificationDto } from './dto/request/resend-verification.dto';
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
  async createOnboardingTenant(
    @Req() req: AuthRequest,
    @Body() dto: CreateOnboardingTenantDto,
  ) {
    const { sub }: Payload = req['user'];
    return this.accountService.createOnboardingTenant({
      AccountId: sub,
      Name: dto.Name,
      Slug: dto.Slug,
    });
  }

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

  @Public()
  @UseGuards(GoogleUserAuthGuard)
  @Get('google/signin')
  googleLoginUser(): void { return; }

  @Public()
  @UseGuards(GoogleUserAuthGuard)
  @Get('google/callback')
  async googleCallbackUser(@Req() req: AccountRequest, @Res() res: Response) {
    const response = await this.authService.signIn(req['user']);
    res.redirect(
      `${this.configService.get('googleOAuth.callbackFrontUser')}?accessToken=${response.accessToken}&refreshToken=${response.refreshToken}`,
    );
  }

  @Public()
  @ApiBearerAuth()
  @UseGuards(RefreshAuthGuard)
  @Post('refreshToken')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: RefreshRequest): Promise<Login> {
    return this.authService.refreshToken(req['user']);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async logoutUser(@Req() req: AuthRequest) {
    const token = (req.headers as Record<string, string>)?.authorization?.split(' ')[1];
    return this.authService.signOutUser(req['user'].sub, token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUser(@Req() req: AuthRequest): Promise<UserResponseDto> {
    const { sub, email }: Payload = req['user'];
    const user = await this.accountService.findMe(sub);
    if (!user) {
      throw new NotFoundException(`User not found ${email}`);
    }

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Atualiza usuário por ID' })
  @ApiBody({ type: UpdateMeRequestDto })
  @ApiResponse({ status: 200, description: 'Usuário atualizado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateMe(@Body() dto: UpdateMeRequestDto, @Req() req: AuthRequest): Promise<UserResponseDto> {
    const user = await this.accountService.updateMe(req['user'].sub, dto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

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
