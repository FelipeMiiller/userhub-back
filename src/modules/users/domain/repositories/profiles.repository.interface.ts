import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  SaveOptions,
} from 'typeorm';
import { ProfileEntity } from '../entities/profile.entities';

export interface ProfilesRepository {
  create(profile: DeepPartial<ProfileEntity>, options?: SaveOptions): Promise<ProfileEntity>;
  update(id: string, profile: DeepPartial<ProfileEntity>): Promise<ProfileEntity | null>;
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
      | FindOptionsWhere<ProfileEntity>
      | FindOptionsWhere<ProfileEntity>[],
  ): Promise<void>;
  findOne(options: FindOneOptions<ProfileEntity>): Promise<ProfileEntity | null>;
  findMany(options?: FindManyOptions<ProfileEntity>): Promise<ProfileEntity[]>;
}

export const PROFILES_REPOSITORY_TOKEN = 'profiles-repository-token';
