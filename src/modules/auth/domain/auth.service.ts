import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import jwtConfig from 'src/config/jwt.config';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { Roles, User } from 'src/modules/users/domain/models/users.models';

import { UsersService } from 'src/modules/users/domain/users.service';
import { Login, Payload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private readonly refresTokenConfig: ConfigType<typeof refreshJwtConfig>,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException(`User not found ${email}`);
    }
    if (!user.Password) {
      throw new ConflictException(`User not found password: ${email}`);
    }

    const passwordMatch = await argon2.verify(user.Password, password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async validateGoogleUser(googleUser: {
    email: string;
    avatarUrl: string;
    primeiroNome: string;
    segundoNome: string;
  }): Promise<User> {
    const { email, avatarUrl, primeiroNome, segundoNome } = googleUser;

    if (!email) {
      throw new UnauthorizedException('Email from Google profile is required');
    }

    let user = await this.usersService.findOneByEmail(email);

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await this.usersService.create({
        Email: email.toLowerCase(),
        Password: randomPassword,
        Name: primeiroNome.toLowerCase(),
        LastName: segundoNome.toLowerCase() || null,
        AvatarUrl: avatarUrl || null,
        Role: Roles.USER,
      });
    }

    if (!user.AvatarUrl && avatarUrl) {
      user = await this.usersService.update(user.Id, {
        AvatarUrl: avatarUrl,
      });
    }

    if (!user) {
      throw new UnauthorizedException(
        'Não foi possível validar ou criar usuário a partir do perfil do Google.',
      );
    }

    return user;
  }

  async loginUser(user: User): Promise<Login> {
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
      throw new UnauthorizedException('Não foi possível atualizar o usuário');
    }

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async updateRefreshTokenUser(id: string, refreshToken: string) {
    return this.usersService.update(id, { HashRefreshToken: refreshToken });
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

  async validateRefreshToken(
    id: string,
    refreshToken: string | undefined,
  ): Promise<Omit<Login, 'accessToken'>> {
    try {
      if (!refreshToken || !id) {
        throw new UnauthorizedException('Refresh token is required');
      }

      await this.verifyRefreshToken(refreshToken);

      const user = await this.usersService.findOneById(id);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      if (!user.HashRefreshToken) {
        throw new UnauthorizedException('Refresh token has been revoked.');
      }
      const refreshtTokenMatches = await argon2.verify(user.HashRefreshToken, refreshToken);
      if (!refreshtTokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
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
      throw new UnauthorizedException('User not found');
    }
    return { ...payload };
  }

  async signOutUser(id: string) {
    await this.usersService.update(id, { HashRefreshToken: null });
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
