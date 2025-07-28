import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/response/user-response.dto';
import { RecoveryPasswordRequestDto } from './dto/request/recovery-password.dto';
import { ChangePasswordRequestDto } from './dto/request/change-password.dto';
import { SigninRequestDto } from './dto/request/signin-users.dto';
import { UpdateMeRequestDto } from './dto/request/update-me.dto';
import { Public } from 'shared/modules/authorization/core/decorator/public.decorator';
import { LoggerService } from 'shared/modules/loggers';
import { JwtAuthGuard, Login, Payload } from 'shared/modules/authorization';
import { AuthenticationService } from '../core/services/auth.service';
import { LocalUserAuthGuard } from '../core/guards/localUser-auth.guard';
import { GoogleUserAuthGuard } from '../core/guards/googleUser-auth.guard';
import { RefreshAuthGuard } from '../core/guards/refresh-auth.guard';
import { signUpRequestDto } from './dto/request/signup-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthentificationController {
  constructor(
    private readonly authService: AuthenticationService,
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

  @Public()
  @UseGuards(LocalUserAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Req() req: Request, @Body() _userDto: SigninRequestDto): Promise<Login> {
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
  async googleLoginUser(@Req() req: Request) {}

  @Public()
  @UseGuards(GoogleUserAuthGuard)
  @Get('google/callback')
  async googleCallbackUser(@Req() req: Request, @Res() res: Response) {
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
  async refreshToken(@Req() req: Request): Promise<Login> {
    return this.authService.refreshToken(req['user']);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async logoutUser(@Req() req: Request) {
    return this.authService.signOutUser(req['user'].sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUser(@Req() req: Request): Promise<UserResponseDto> {
    const { sub, email }: Payload = req['user'];
    const user = await this.authService.findMe(sub);
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
  async updateMe(@Body() dto: UpdateMeRequestDto, @Req() req: Request): Promise<UserResponseDto> {
    const user = await this.authService.updateMe(req['user'].sub, dto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
