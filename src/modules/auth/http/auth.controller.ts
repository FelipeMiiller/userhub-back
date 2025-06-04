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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../domain/decorator/public.decorator';
import { AuthService } from '../domain/auth.service';
import { UsersService } from 'src/modules/users/domain/users.service';
import { LocalUserAuthGuard } from '../domain/guards/localUser-auth.guard';
import { Login, Payload } from '../domain/types';
import { GoogleUserAuthGuard } from '../domain/guards/googleUser-auth.guard';
import { RefreshAuthGuard } from '../domain/guards/refresh-auth.guard';
import { JwtAuthGuard } from '../domain/guards/jwt-auth.guard';
import { instanceToPlain } from 'class-transformer';
import { Roles, User } from 'src/modules/users/domain/models/users.models';
import { UserOutput } from 'src/modules/users/http/dtos/output-users.dto';
import { UserInputAuth } from './dto/create-users.dto';

@ApiTags('auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

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
  async loginUser(@Req() req: Request): Promise<Login> {
    return this.authService.loginUser(req['user']);
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
    const { sub }: Payload = req['user'];
    const user = await this.usersService.findOneById(sub);

    return user;
  }
}
