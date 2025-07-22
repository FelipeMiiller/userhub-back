import { Injectable } from '@nestjs/common';
import { LoggerService } from 'shared/modules/loggers/domain/logger.service';
import * as argon2 from 'argon2';
import { LessThanOrEqual } from 'typeorm';
import { generateRandomPassword } from 'shared/lib/utils/password.utils';
import { User } from '../models/users.models';
import { UsersRepository } from 'packages/identity/persistence/repositories/users.typeorm.repository';
import { Roles } from '../enum/role.enum';
import { CreateUserRequestDto } from 'packages/identity/http/dto/request/create-user.dto';
import { EmailProducer } from 'packages/identity/integration/producers/email.producer';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly loggerService: LoggerService,
    private readonly emailProducer: EmailProducer,
  ) {
    this.loggerService.contextName = UsersService.name;
  }

  async create(createUserDto: CreateUserRequestDto) {
    const { Password, Role, ...userData } = createUserDto;

    const user = await this.usersRepository.create({
      ...userData,
      Password: await argon2.hash(Password),
      Role: Role || Roles.USER,
      HashRefreshToken: null,
    });

    this.emailProducer.sendWelcomeEmail(user.Email, user.FirstName);

    this.loggerService.info(`Usuário criado com sucesso: ${user.FirstName}`);
    return user;
  }

  async update(id: string, user: Partial<User>) {
    return this.usersRepository.update(id, user);
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    await this.usersRepository.updateRefreshToken(id, refreshToken);
  }

  async findOneById(id: string) {
    return this.usersRepository.findOneById(id);
  }

  async findOneByEmail(Email: string) {
    return this.usersRepository.findOneByEmail(Email);
  }

  async resetPassword(userId: string) {
    const newPassword = generateRandomPassword(12);
    const hashedPassword = await argon2.hash(newPassword);
    const user = await this.usersRepository.update(userId, {
      Password: hashedPassword,
      HashRefreshToken: null,
    });

    this.emailProducer.sendPasswordResetEmail(user.Email, user.FirstName, newPassword);
    return user;
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
  async findInactive(days = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return this.usersRepository.findMany({
      where: [{ LastLoginAt: null }, { LastLoginAt: LessThanOrEqual(sinceDate) }],
      order: { LastLoginAt: 'ASC' },
    });
  }

  async delete(id: string): Promise<void> {
    return this.usersRepository.delete(id);
  }
}
