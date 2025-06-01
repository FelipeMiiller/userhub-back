import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { UserInput } from '../http/dtos/create-users.dto';
import { LoggerService } from 'src/common/loggers/domain/logger.service';

import { UpdateUser } from '../http/dtos/update-users.dto';
import { User } from './models/users.models';
import { USERS_REPOSITORY_TOKEN, UsersRepository } from './repositories/users.repository.interface';
import * as argon2 from 'argon2';
import { UserCreatedEvent } from 'src/common/events/user-created.event';
@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: UsersRepository,
    @InjectQueue('users') private usersQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.contextName = UsersService.name;
  }

  async create(createUserDto: UserInput): Promise<User> {
    const { Profile, Password, ...user } = createUserDto;
    const hashedPassword = await argon2.hash(Password);
    const create = await this.usersRepository.create({
      ...user,
      Password: hashedPassword,
      Profile: Profile,
      HashRefreshToken: null,
    });
    this.eventEmitter.emit('user.created', new UserCreatedEvent(Profile.Name, user.Email));
    await this.usersQueue.add('user.created', new UserCreatedEvent(Profile.Name, user.Email));
    await this.usersQueue.add('user.email.send', new UserCreatedEvent(Profile.Name, user.Email));
    return create;
  }

  @OnEvent('user.created', { async: true })
  async welcomeNewUser(event: UserCreatedEvent) {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 6000));

    this.loggerService.info(`USER CREATED --> EVENT EMITTER ${event.email}`);
  }

  async update(id: string, user: UpdateUser): Promise<User> {
    const userUpdated = await this.usersRepository.update(id, user);

    this.loggerService.info(`update user ${userUpdated.Email}`);
    return userUpdated;
  }

  async findMany(pagination?: { page?: number; limit?: number }): Promise<User[]> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const skip = (page - 1) * limit;
    return this.usersRepository.findMany({
      skip,
      take: limit,
      relations: { Profile: true },
    });
  }

  async findOneById(Id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { Id }, relations: { Profile: true } });
  }

  async findOneByEmail(Email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { Email }, relations: { Profile: true } });
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
