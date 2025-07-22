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
import { LoggerService } from 'shared/modules/loggers/domain/logger.service';
import { AuthService } from '../core/services/auth.service';
import { UsersService } from '../core/services/users.service';
import { Public } from '../core/decorator/public.decorator';
import { plainToInstance } from 'class-transformer';
import { LocalUserAuthGuard } from '../core/guards/localUser-auth.guard';
import { Login, Payload } from '../core/types';
import { GoogleUserAuthGuard } from '../core/guards/googleUser-auth.guard';
import { RefreshAuthGuard } from '../core/guards/refresh-auth.guard';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CreateUserRequestDto } from './dto/request/create-user.dto';
import { UserResponseDto } from './dto/response/user-response.dto';
import { RecoveryPasswordRequestDto } from './dto/request/recovery-password.dto';
import { ChangePasswordRequestDto } from './dto/request/change-password.dto';
import { Roles } from 'packages/identity/core/enum/role.enum';
import { SigninRequestDto } from './dto/request/signin-users.dto';
import { UpdateUserRequestDto } from './dto/request/update-users.dto';

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
  async create(@Body() userDto: CreateUserRequestDto): Promise<UserResponseDto> {
    const user = await this.usersService.create({
      ...userDto,
      Role: Roles.USER,
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
    const user = await this.usersService.findOneById(sub);
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
  @ApiBody({ type: UpdateUserRequestDto })
  @ApiResponse({ status: 200, description: 'Usuário atualizado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateMe(
    @Body() dto: UpdateUserRequestDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(req['user'].sub, dto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }


}
