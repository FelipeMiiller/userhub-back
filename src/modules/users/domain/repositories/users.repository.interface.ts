import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  SaveOptions,
} from 'typeorm';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';

export interface UsersRepository {
  create(user: DeepPartial<UserEntity>, options?: SaveOptions): Promise<UserEntity>;
  findOne(options: FindOneOptions<UserEntity>): Promise<UserEntity | null>;
  findMany(options?: FindManyOptions<UserEntity>): Promise<UserEntity[]>;
  update(
    id: string,
    user: DeepPartial<UserEntity>,
    options?: SaveOptions,
  ): Promise<UserEntity | null>;

  delete(
    criteria:
      | string
      | number
      | Date
      | ObjectId
      | string[]
      | number[]
      | Date[]
      | ObjectId[]
      | FindOptionsWhere<UserEntity>
      | FindOptionsWhere<UserEntity>[],
  ): Promise<void>;
  clear(): Promise<void>;
}

export const USERS_REPOSITORY_TOKEN = 'users-repository-token';
