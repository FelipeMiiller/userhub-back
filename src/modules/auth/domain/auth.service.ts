import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import jwtConfig from 'src/config/jwt.config';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import { User } from 'src/modules/users/domain/models/users.models';

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
    if (user.Password === null || user.Password === undefined) {
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
    const { email } = googleUser;

    if (!email) {
      throw new UnauthorizedException('Email required');
    }
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException(`Not found ${email}`);
    }

    if (!user.AvatarUrl) {
      await this.usersService.update(user.Id, {
        AvatarUrl: googleUser.avatarUrl,
      });
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
    });

    if (!userUpdated) {
      throw new UnauthorizedException('User not found');
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

    // Criamos um NOVO payload para o accessToken, omitindo 'iat' e 'exp' do payload do refresh token
    const newAccessTokenPayload: Omit<Payload, 'iat' | 'exp'> = {
      sub: verifiedRefreshPayload.sub,
      email: verifiedRefreshPayload.email,
      role: verifiedRefreshPayload.role,
      status: verifiedRefreshPayload.status,
    };
    console.log('[AuthService.refreshToken] newAccessTokenPayload:', newAccessTokenPayload);

    // Geramos o novo accessToken com o payload limpo e as opções corretas
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

      console.log('oiooi');
      await this.verifyRefreshToken(refreshToken);

      const user = await this.usersService.findOneById(id);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      if (!user.HashRefreshToken) {
        throw new UnauthorizedException('Refresh token has been revoked.');
      }
      console.log('user.HashRefreshToken');

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
    console.log('[AuthService.validateJwt] Received payload:', payload);
    const { sub } = payload;

    const user = await this.usersService.findOneById(sub);
    console.log(
      '[AuthService.validateJwt] User found for sub ' + sub + ':',
      user ? user.Id : 'null',
    );
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
