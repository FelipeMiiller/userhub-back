import { EmailProducer } from "../../../integration/producers/email.producer";
import { UsersRepository } from "../../../persistence/repository/users.typeorm.repository";
import { LoggerService } from "shared/module/loggers";
import { CreateUserRequestDto } from "../../http/dto/request/create-user.dto";
import * as argon2 from 'argon2';
import { Roles } from "shared/module/authorization";
import { User } from "../../../persistence/entities/users.entities";
import { IsNull, LessThanOrEqual } from "typeorm";
import { Injectable } from "@nestjs/common";

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

  async findMany({
    role,
    sortBy,
    order,
    skip,
    take,
  }: {
    role?: Roles;
    sortBy?: keyof User;
    order?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  }): Promise<User[]> {
    return this.usersRepository.findMany({
      where: role ? { Role: role } : undefined,
      order: sortBy ? ({ [sortBy]: order } ) : undefined,
      skip,
      take,
    });
  }
  async findInactive(days = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return this.usersRepository.findMany({
      where: [{ LastLoginAt: IsNull() }, { LastLoginAt: LessThanOrEqual(sinceDate) }],
      order: { LastLoginAt: 'ASC' },
    });
  }

  async delete(id: string): Promise<void> {
    return this.usersRepository.delete(id);
  }
}
