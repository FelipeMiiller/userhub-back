import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { generateRandomPassword } from 'shared/lib/utils/password.utils';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { LoggerService } from 'shared/modules/loggers/domain/logger.service';
import { UsersService } from './users.service';
import { Login, Payload } from '../types';
import refreshJwtConfig from 'packages/identity/config/refresh-jwt.config';
import jwtConfig from 'packages/identity/config/jwt.config';
import { ChangePasswordRequestDto } from 'packages/identity/http/dto/request/change-password.dto';
import { User } from 'packages/identity/core/models/users.models';
import { Roles } from '../enum/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private readonly refresTokenConfig: ConfigType<typeof refreshJwtConfig>,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = AuthService.name;
  }

  async signIn(user: User): Promise<Login> {
    const payload: Payload = {
      sub: user.Id,
      email: user.Email,
      role: user.Role,
      status: user.Status,
    };

    const { accessToken, refreshToken } = await this.generateToken(payload);
    const hashRefreshToken = await argon2.hash(refreshToken);

    const userUpdated = await this.usersService.update(user.Id, {
      HashRefreshToken: hashRefreshToken,
      LastLoginAt: new Date(),
    });

    if (!userUpdated) {
      throw new UnauthorizedException('Não foi gerado token de acesso!');
    }

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async recoveryPassword(email: string): Promise<void> {
    try {
      const user = await this.usersService.findOneByEmail(email);

      if (!user) {
        throw new BadRequestException('E-mail não cadastrado');
      }
      await this.usersService.resetPassword(user.Id);
    } catch (error) {
      this.loggerService.error(`Erro ao processar recuperação de senha: ${error.message}`, {
        Email: email,
        stack: error.stack,
      });
      throw new BadRequestException(
        'Não foi possível processar sua solicitação. Por favor, tente novamente.',
      );
    }
  }

  async changePassword(changeDto: ChangePasswordRequestDto & { Email: string }): Promise<void> {
    try {
      const validateUser = await this.validateUser(changeDto.Email, changeDto.Password);

      if (!validateUser) {
        throw new BadRequestException('E-mail não cadastrado');
      }
      const hashedPassword = await argon2.hash(changeDto.NewPassword);
      await this.usersService.update(validateUser.Id, { Password: hashedPassword });
    } catch (error) {
      this.loggerService.error(`Erro ao processar alteração de senha: ${error.message}`, {
        stack: error.stack,
        email: changeDto.Email,
      });
      throw new BadRequestException(
        'Não foi possível processar sua solicitação. Por favor, tente novamente.',
      );
    }
  }

  async updateRefreshTokenUser(id: string, refreshToken: string) {
    return this.usersService.update(id, { HashRefreshToken: refreshToken });
  }

  async refreshToken({ refreshToken }: Omit<Login, 'accessToken'>): Promise<Login> {
    const verifiedRefreshPayload: Payload = await this.verifyRefreshToken(refreshToken);

    const newAccessTokenPayload: Omit<Payload, 'iat' | 'exp'> = {
      sub: verifiedRefreshPayload.sub,
      email: verifiedRefreshPayload.email,
      role: verifiedRefreshPayload.role,
      status: verifiedRefreshPayload.status,
    };

    const newAccessToken = await this.jwtService.signAsync(newAccessTokenPayload, {
      secret: this.jwtConfiguration.secret,
      ...this.jwtConfiguration.signOptions,
    });
    return {
      accessToken: newAccessToken,
      refreshToken: refreshToken,
    };
  }

  async generateToken(payload: Payload): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.refresTokenConfig.secret,
        ...this.refresTokenConfig.signOptions,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(
    id: string,
    refreshToken: string | undefined,
  ): Promise<Omit<Login, 'accessToken'>> {
    try {
      if (!refreshToken || !id) {
        throw new UnauthorizedException('Token de atualização de acesso inválido!');
      }

      await this.verifyRefreshToken(refreshToken);

      const user = await this.usersService.findOneById(id);
      if (!user) {
        throw new UnauthorizedException('Token de atualização de acesso inválido!');
      }
      if (!user.HashRefreshToken) {
        throw new UnauthorizedException('Token de atualização de acesso inválido!');
      }
      const refreshtTokenMatches = await argon2.verify(user.HashRefreshToken, refreshToken);
      if (!refreshtTokenMatches) {
        throw new UnauthorizedException('Token de atualização de acesso inválido!');
      }
      return { refreshToken };
    } catch (error) {
      throw error;
    }
  }

  async validateJwt(payload: Payload): Promise<Payload> {
    const { sub } = payload;

    const user = await this.usersService.findOneById(sub);

    if (!user) {
      throw new UnauthorizedException('Token de atualização de acesso inválido!');
    }
    return { ...payload };
  }

  async signOutUser(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async validateUser(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new UnauthorizedException('Email e senha são obrigatórios');
    }

    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException(`Usuário não encontrado ${email}`);
    }
    if (!user.Password) {
      throw new ConflictException(`Senha do usuário não encontrada: ${email}`);
    }

    const passwordMatch = await argon2.verify(user.Password, password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }

  async validateGoogleUser(googleUser: {
    email: string;
    photo: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const { email, photo, firstName, lastName } = googleUser;

    if (!email) {
      throw new UnauthorizedException('Email from Google profile is required');
    }

    let user = await this.usersService.findOneByEmail(email);

    if (!user) {
      const randomPassword = generateRandomPassword(12);
      user = await this.usersService.create({
        Email: email.toLowerCase(),
        Password: randomPassword,
        FirstName: firstName.toLowerCase(),
        LastName: lastName.toLowerCase() || null,
        Photo: photo || null,
        Role: Roles.USER,
      });
    }

    if (!user.Photo && photo) {
      user = await this.usersService.update(user.Id, {
        Photo: photo,
      });
    }

    if (!user) {
      throw new UnauthorizedException(
        'Não foi possível validar ou criar usuário a partir do perfil do Google.',
      );
    }

    return user;
  }

  async verifyToken(token: string): Promise<Payload> {
    if (!this.jwtConfiguration.signOptions?.algorithm || !this.jwtConfiguration.secret) {
      throw new Error('JWT algorithm or secret is not defined in configuration.');
    }
    return this.jwtService.verifyAsync(token, {
      secret: this.jwtConfiguration.secret,
      algorithms: [this.jwtConfiguration.signOptions.algorithm],
    });
  }

  async verifyRefreshToken(token: string): Promise<Payload> {
    if (!this.refresTokenConfig.signOptions?.algorithm || !this.refresTokenConfig.secret) {
      throw new Error('JWT algorithm or secret is not defined in configuration.');
    }
    return this.jwtService.verifyAsync(token, {
      secret: this.refresTokenConfig.secret,
      algorithms: [this.refresTokenConfig.signOptions.algorithm],
    });
  }

  async decodeToken(token: string): Promise<Payload> {
    return this.jwtService.decode(token);
  }
}
