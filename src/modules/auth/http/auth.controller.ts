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
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../domain/decorator/public.decorator';
import { AuthService } from '../domain/auth.service';
import { UsersService } from 'src/modules/users/domain/users.service';
import { LocalUserAuthGuard } from '../domain/guards/localUser-auth.guard';
import { Login, Payload } from '../domain/types';
import { GoogleUserAuthGuard } from '../domain/guards/googleUser-auth.guard';
import { RefreshAuthGuard } from '../domain/guards/refresh-auth.guard';
import { JwtAuthGuard } from '../domain/guards/jwt-auth.guard';
import { Roles, User } from 'src/modules/users/domain/models/users.models';
import { UserInputAuth } from './dto/create-users.dto';
import { UserInputSignin } from './dto/signin-users.dto';
import { RecoveryPasswordDto } from './dto/recovery-password.dto';
import { LoggerService } from 'src/common/loggers/domain/logger.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = AuthController.name;
  }

  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Post('signup')
  async create(@Body() userDto: UserInputAuth): Promise<User> {
    const user = await this.usersService.create({
      ...userDto,
      Role: Roles.USER,
    });

    return user;
  }

  @Public()
  @UseGuards(LocalUserAuthGuard)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Req() req: Request, @Body() _userDto: UserInputSignin): Promise<Login> {
    return this.authService.loginUser(req['user']);
  }

  @ApiOperation({ summary: 'Solicita a recuperação de senha' })
  @ApiBody({ type: RecoveryPasswordDto })
  @ApiResponse({
    status: 202,
    description: 'Se o e-mail estiver cadastrado, uma nova senha será enviada',
  })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async ForgotPassword(@Body() recoveryDto: RecoveryPasswordDto): Promise<{ message: string }> {
    try {
      await this.authService.resetPassword(recoveryDto.email);
      return {
        message:
          'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
      };
    } catch (error) {
      this.loggerService.error(
        `Erro ao processar recuperação de senha: ${error.message}`,
        error.stack,
        {
          slack: true,
          userId: recoveryDto.email,
        },
      );
      throw new BadRequestException(
        'Não foi possível processar sua solicitação. Por favor, tente novamente.',
      );
    }
  }

  @Public()
  @UseGuards(GoogleUserAuthGuard)
  @Get('google/signin')
  async googleLoginUser(@Req() req: Request) {}

  @Public()
  @UseGuards(GoogleUserAuthGuard)
  @Get('google/callback')
  async googleCallbackUser(@Req() req: Request, @Res() res: Response) {
    const response = await this.authService.loginUser(req['user']);
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
    console.log('req["user"]', req['user']);
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
  async getUser(@Req() req: Request): Promise<User> {
    const { sub, email }: Payload = req['user'];
    const user = await this.usersService.findOneById(sub);
    if (!user) {
      throw new NotFoundException(`User not found ${email}`);
    }

    return user;
  }
}
