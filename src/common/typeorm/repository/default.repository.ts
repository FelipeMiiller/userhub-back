import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  Repository,
  SaveOptions,
} from 'typeorm';
import { DatabaseException } from '../exeption/database.exception';

interface PostgresError {
  code: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
  [key: string]: any;
}

export abstract class DefaultRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  protected handlePostgresError(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const pgError = error as PostgresError;
      switch (pgError.code) {
        case '23505':
          throw new ConflictException('Registro duplicado.', {
            cause: pgError,
            description: 'Já existe registro com os dados informados.',
          });
        case '23502':
          throw new BadRequestException('Campo obrigatório não informado.', {
            cause: pgError,
            description: 'Verifique os campos obrigatórios.',
          });
        case '23503':
          throw new BadRequestException('Relacionamento inválido.', {
            cause: pgError,
            description: 'Verifique as chaves estrangeiras.',
          });
        case '23514':
          throw new UnprocessableEntityException('Valor inválido para um dos campos.', {
            cause: pgError,
            description: 'Verifique as restrições dos campos.',
          });
        default:
          throw new DatabaseException(
            'Ocorreu um erro inesperado no banco de dados.',
            pgError.code,
            {
              cause: pgError,
              description: `Código de erro PostgreSQL: ${pgError.code}`,
            },
          );
      }
    }
    throw new DatabaseException('Ocorreu um erro desconhecido no banco de dados.');
  }

  async create(entity: DeepPartial<T>, options?: SaveOptions): Promise<T> {
    try {
      const newEntity = this.repository.create(entity);
      return await this.repository.save(newEntity, options);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }

  async update(id: string, entity: DeepPartial<T>, options?: SaveOptions): Promise<T | null> {
    const updateEntity = await this.repository.preload({
      Id: id,
      ...entity,
    });
    if (!updateEntity) {
      return null;
    }
    try {
      return await this.repository.save(updateEntity, options);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }

  async findOne(Options: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.repository.findOne(Options);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }

  async findMany(Options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find(Options);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }

  async delete(
    criteria:
      | string
      | number
      | Date
      | ObjectId
      | string[]
      | number[]
      | Date[]
      | ObjectId[]
      | FindOptionsWhere<T>
      | FindOptionsWhere<T>[],
  ): Promise<void> {
    try {
      await this.repository.delete(criteria);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }
}
