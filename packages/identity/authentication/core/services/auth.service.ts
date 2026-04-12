import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { generateRandomPassword } from '@hub/shared-lib';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4, v7 as uuidv7 } from 'uuid';
import { LoggerService } from '@hub/shared-module/loggers';
import refreshJwtConfig from '../../../config/refresh-jwt.config';
import { ChangePasswordRequestDto } from '../../http/dto/request/change-password.dto';
import { AuthorizationService, Login, Payload } from '@hub/shared-module/authorization';
import jwtConfig from '@hub/shared-module/authorization/config/jwt.config';
import { Account } from '../../../persistence/entities/accounts.entities';
import { signUpRequestDto } from '../../http/dto/request/signup-user.dto';
import { SignInDto } from '../../http/dto/request/signIn.dto';
import { PermissionEvaluatorService } from '../../../core/services/permission-evaluator.service';
import { AccountService } from './account.service';
import { EmailProducer } from '../../../integration/producers/email.producer';
import * as argon2 from 'argon2';


@Injectable()
export class AuthenticationService {
  constructor(
    private readonly accountService: AccountService,
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private readonly refresTokenConfig: ConfigType<typeof refreshJwtConfig>,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly loggerService: LoggerService,
    private readonly permissionEvaluatorService: PermissionEvaluatorService,
    private readonly authorizationService: AuthorizationService,
    private readonly emailProducer: EmailProducer,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,

  ) {
    this.loggerService.contextName = AuthenticationService.name;
  }


  async signUp(dto: signUpRequestDto): Promise<Account> {
    const existing = await this.accountService.findOneByEmail(dto.Email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    // AccountService.createWithProfile recebe senha em texto plano e faz o hash internamente
    const account = await this.accountService.createWithProfile({
      Email: dto.Email,
      Password: dto.Password,
      Provider: 'local',
      HashRefreshToken: null,
      EmailVerified: false,
      Status: true,
      FirstName: dto.FirstName,
      LastName: dto.LastName ?? null,
      Photo: dto.Photo ?? null,
    });

    this.emailProducer.sendWelcomeEmail(dto.Email, dto.FirstName);
    this.loggerService.info(`Account criada: ${account.Email}`);

    // Dispara verificação de e-mail de forma assíncrona (não bloqueia o cadastro)
    this.sendVerificationEmail(account.Id).catch((err) =>
      this.loggerService.error('Erro ao enviar e-mail de verificação', { error: err }),
    );

    return account;
  }

  async signIn(user: SignInDto): Promise<Login> {
    const tenants = await this.permissionEvaluatorService.getAllTenantsPermissions(user.Id);

    const payload: Payload = {
      
      sub: user.Id,
      email: user.Email,
      status: user.Status,
      tenants,
    };

    const { accessToken, refreshToken } = await this.generateToken(payload);
    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Não foi gerado token de acesso!');
    }

    await this.accountService.updateRefreshToken(user.Id, refreshToken);


    return { accessToken, refreshToken };
  }

  async signOutUser(accountId: string, accessToken?: string): Promise<void> {
    await this.accountService.updateRefreshToken(accountId, null);
    if (accessToken) {
      await this.authorizationService.revokeToken(accessToken);
      this.accountService.updateRefreshToken(accountId, null);
    }
  }

  async recoveryPassword(email: string): Promise<void> {
    try {
      const account = await this.accountService.findOneByEmail(email);

      if (!account) {
        throw new BadRequestException('E-mail não cadastrado');
      }

      const profile = await this.accountService.findProfileByAccountId(account.Id);
      const newPassword = generateRandomPassword(12);

      // resetPassword faz o hash internamente e invalida o refresh token
      await this.accountService.resetPassword(account.Id, newPassword);

      this.emailProducer.sendPasswordResetEmail(
        account.Email,
        profile?.FirstName ?? 'Usuário',
        newPassword,
      );
    } catch (error) {
      this.loggerService.error(
        `Erro ao processar recuperação de senha: ${(error as Error).message}`,
        { Email: email, stack: (error as Error).stack },
      );
      throw new BadRequestException(
        'Não foi possível processar sua solicitação. Por favor, tente novamente.',
      );
    }
  }

  async changePassword(changeDto: ChangePasswordRequestDto & { Email: string }): Promise<void> {
    try {
      const account = await this.validateUser(changeDto.Email, changeDto.Password);

      await this.accountService.updatePassword(account.Id, changeDto.NewPassword);
    } catch (error) {
      this.loggerService.error(
        `Erro ao processar alteração de senha: ${(error as Error).message}`,
        { stack: (error as Error).stack, email: changeDto.Email },
      );
      throw new BadRequestException(
        'Não foi possível processar sua solicitação. Por favor, tente novamente.',
      );
    }
  }





  async refreshToken({ refreshToken }: Omit<Login, 'accessToken'>): Promise<Login> {
    const verifiedRefreshPayload: Payload = await this.verifyRefreshToken(refreshToken);

    // Re-busca permissões atualizadas — podem ter mudado desde o último login
    const tenants = await this.permissionEvaluatorService.getAllTenantsPermissions(
      verifiedRefreshPayload.sub,
    );

    const newAccessTokenPayload: Omit<Payload, 'iat' | 'exp'> = {
      jti: uuidv7(),
      sub: verifiedRefreshPayload.sub,
      email: verifiedRefreshPayload.email,
      status: verifiedRefreshPayload.status,
      tenants,
    };

    const newAccessToken = await this.jwtService.signAsync(newAccessTokenPayload, {
      secret: this.jwtConfiguration.secret as string,
      ...this.jwtConfiguration.signOptions,
    });

    return { accessToken: newAccessToken, refreshToken };
  }

  async generateToken(payload: Payload): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = uuidv7();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ ...payload, jti }),
      this.jwtService.signAsync({ ...payload, jti: uuidv7() }, {
        secret: this.refresTokenConfig.secret as string,
        ...this.refresTokenConfig.signOptions,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(
    id: string,
    refreshToken: string | undefined,
  ): Promise<Omit<Login, 'accessToken'>> {
    if (!refreshToken || !id) {
      throw new UnauthorizedException('Token de atualização de acesso inválido!');
    }

    await this.verifyRefreshToken(refreshToken);

    const account = await this.accountService.findOneById(id);
    if (!account) {
      throw new UnauthorizedException('Token de atualização de acesso inválido!');
    }
    if (!account.HashRefreshToken) {
      throw new UnauthorizedException('Token de atualização de acesso inválido!');
    }
    const matches = await argon2.verify(account.HashRefreshToken, refreshToken);
    if (!matches) {
      throw new UnauthorizedException('Token de atualização de acesso inválido!');
    }

    return { refreshToken };
  }

  async validateJwt(payload: Payload): Promise<Payload> {
    const account = await this.accountService.findOneById(payload.sub);
    if (!account) {
      throw new UnauthorizedException('Token inválido!');
    }
    return { ...payload };
  }

  async validateUser(email: string, password: string): Promise<Account> {
    if (!email || !password) {
      throw new UnauthorizedException('Email e senha são obrigatórios');
    }

    const account = await this.accountService.findOneByEmail(email);
    if (!account) {
      throw new NotFoundException(`Usuário não encontrado: ${email}`);
    }
    if (!account.Password) {
      throw new ConflictException(`Senha não encontrada: ${email}`);
    }

    const passwordMatch = await argon2.verify(account.Password, password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return account;
  }

  async validateGoogleUser(googleUser: {
    email: string;
    photo: string;
    firstName: string;
    lastName: string;
  }): Promise<Account> {
    const { email, photo, firstName, lastName } = googleUser;

    if (!email) {
      throw new UnauthorizedException('Email from Google profile is required');
    }

    let account = await this.accountService.findOneByEmail(email.toLowerCase());

    if (!account) {
      const randomPassword = generateRandomPassword(12);
      // AccountService.createWithProfile recebe senha em texto plano e faz o hash internamente
      account = await this.accountService.createWithProfile({
        Email: email.toLowerCase(),
        Password: randomPassword,
        Provider: 'google',
        HashRefreshToken: null,
        EmailVerified: true,
        Status: true,
        FirstName: firstName.toLowerCase(),
        LastName: lastName.toLowerCase() || null,
        Photo: photo || null,
      });
    } else {
      const profile = await this.accountService.findProfileByAccountId(account.Id);
      if (profile && !profile.Photo && photo) {
        await this.accountService.updateProfile(profile.Id, { Photo: photo });
      }
    }

    return account as Account;
  }

  async verifyRefreshToken(token: string): Promise<Payload> {
    if (!this.refresTokenConfig.signOptions?.algorithm || !this.refresTokenConfig.secret) {
      throw new Error('JWT algorithm or secret is not defined in configuration.');
    }
    return this.jwtService.verifyAsync(token, {
      secret: this.refresTokenConfig.secret as string,
      algorithms: [this.refresTokenConfig.signOptions.algorithm],
    });
  }

  async decodeToken(token: string): Promise<Payload> {
    return this.jwtService.decode(token);
  }

  private readonly EMAIL_VERIFICATION_TTL = 24 * 60 * 60 * 1000; // 24h em ms
  private readonly EMAIL_VERIFICATION_PREFIX = 'email-verification:';

  async sendVerificationEmail(accountId: string): Promise<void> {
    const account = await this.accountService.findOneById(accountId);
    if (!account) {
      throw new NotFoundException('Account não encontrada');
    }

    if (account.EmailVerified) {
      return;
    }

    const token = uuidv4();
    await this.cacheManager.set(
      `${this.EMAIL_VERIFICATION_PREFIX}${token}`,
      accountId,
      this.EMAIL_VERIFICATION_TTL,
    );

    const profile = await this.accountService.findProfileByAccountId(accountId);
    await this.emailProducer.sendAccountActivationEmail(
      account.Email,
      token,
      profile?.FirstName ?? 'Usuário',
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const accountId = await this.cacheManager.get<string>(
      `${this.EMAIL_VERIFICATION_PREFIX}${token}`,
    );

    if (!accountId) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    await this.accountService.updateEmailVerified(accountId);
    await this.cacheManager.del(`${this.EMAIL_VERIFICATION_PREFIX}${token}`);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const account = await this.accountService.findOneByEmail(email);
    if (!account) {
      throw new NotFoundException('Account não encontrada');
    }

    if (account.EmailVerified) {
      return;
    }

    await this.sendVerificationEmail(account.Id);
  }
}
