import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserEvents } from 'src/common/events/events.enum';
import { UserInput } from '../http/dtos/create-users.dto';
import { LoggerService } from 'src/common/loggers/domain/logger.service';
import { Roles, User } from './models/users.models';
import { USERS_REPOSITORY_TOKEN, UsersRepository } from './repositories/users.repository.interface';
import * as argon2 from 'argon2';
import { LessThanOrEqual } from 'typeorm';
import { UserCreatedEvent } from 'src/common/events/user-created.event';
import { ResetPasswordEvent } from 'src/common/events/reset-password.event';
import { MailService } from 'src/modules/mail/domain/mail.service';
import { ConfigService } from '@nestjs/config';
import { generateRandomPassword } from 'src/common/utils/password.utils';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: UsersRepository,
    private readonly loggerService: LoggerService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.loggerService.contextName = UsersService.name;
  }

  async create(
    createUserDto: UserInput & { LastLoginAt?: Date; CreatedAt?: Date; UpdatedAt?: Date },
  ): Promise<User> {
    const { Password, Role, ...userData } = createUserDto;
    const hashedPassword = await argon2.hash(Password);
    const roleToSet = Role || Roles.USER;

    const user = await this.usersRepository.create({
      ...userData,
      Password: hashedPassword,
      Role: roleToSet,
      HashRefreshToken: null,
    });

    this.eventEmitter.emit(
      UserEvents.USER_CREATED,
      new UserCreatedEvent(user.Id, user.Email, user.Name),
    );

    this.loggerService.info(`Usuário criado com sucesso: ${user.Name}`);
    return new User(user);
  }

  @OnEvent(UserEvents.USER_CREATED, { async: true })
  async welcomeNewUser(event: UserCreatedEvent) {
    try {
      this.mailService.sendWelcomeEmail(event.email, event.name);
      this.loggerService.info(`E-mail de boas-vindas enviado para: ${event.email}`);
    } catch (error) {
      this.loggerService.error(
        `Falha ao enviar e-mail de boas-vindas para ${event.email}:`,
        error,
        {
          userId: event.userId || 'N/A',
          slack: true,
        },
      );
    }
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    return this.usersRepository.update(id, user);
  }

  async updateUserRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.usersRepository.update(id, { HashRefreshToken: refreshToken });
  }

  async resetPassword(userId: string): Promise<User | null> {
    const newPassword = generateRandomPassword(12);
    const hashedPassword = await argon2.hash(newPassword);
    const user = await this.usersRepository.update(userId, {
      Password: hashedPassword,
      HashRefreshToken: null,
    });
    this.eventEmitter.emit(
      UserEvents.PASSWORD_RESET,
      new ResetPasswordEvent(user.Email, user.Name, newPassword),
    );
    return new User(user);
  }

  @OnEvent(UserEvents.PASSWORD_RESET, { async: true })
  async handleResetPasswordEvent(event: ResetPasswordEvent) {
    try {
      this.mailService.sendResetPasswordEmail(event.email, event.name, event.newPassword);

      this.loggerService.info(`E-mail de recuperação de senha enviado para: ${event.email}`);
    } catch (error) {
      this.loggerService.error(
        `Falha ao enviar e-mail de recuperação para ${event.email}:`,
        error.stack,
        {
          userId: event.email,
          slack: true,
        },
      );
    }
  }

  async findMany({
    role,
    sortBy,
    order,
    skip,
    take,
  }: {
    role?: Roles;
    sortBy?: string;
    order?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<User[]> {
    return this.usersRepository.findMany({
      where: role ? { Role: role } : undefined,
      order: { [sortBy]: order },
      skip,
      take,
    });
  }

  async findInactive(days = 30): Promise<User[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return this.usersRepository.findMany({
      where: [{ LastLoginAt: null }, { LastLoginAt: LessThanOrEqual(sinceDate) }],
      order: { LastLoginAt: 'ASC' },
    });
  }

  async findOneById(Id: string): Promise<User | null> {
    const userEntity = await this.usersRepository.findOne({ where: { Id } });
    if (!userEntity) {
      return null;
    }
    return new User(userEntity);
  }

  async findOneByEmail(Email: string): Promise<User | null> {
    const userEntity = await this.usersRepository.findOne({ where: { Email } });
    if (!userEntity) {
      return null;
    }
    return new User(userEntity);
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
