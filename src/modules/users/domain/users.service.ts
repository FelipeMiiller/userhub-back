import { Inject, Injectable } from '@nestjs/common';
import { UserInput } from '../http/dtos/create-users.dto';
import { LoggerService } from 'src/common/loggers/domain/logger.service';
import { Roles, User } from './models/users.models';
import { USERS_REPOSITORY_TOKEN, UsersRepository } from './repositories/users.repository.interface';
import * as argon2 from 'argon2';
import { LessThanOrEqual } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: UsersRepository,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = UsersService.name;
  }

  async create(createUserDto: UserInput): Promise<User> {
    const { Password, Role, ...userData } = createUserDto;
    const hashedPassword = await argon2.hash(Password);
    const roleToSet = Role || Roles.USER;

    const user = await this.usersRepository.create({
      ...userData,
      Password: hashedPassword,
      Role: roleToSet,
      HashRefreshToken: null,
    });
    return new User(user);
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    return this.usersRepository.update(id, user);
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
