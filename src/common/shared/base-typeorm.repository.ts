import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  Repository,
  SaveOptions,
} from 'typeorm';

/**
 * BaseTypeOrmRepository<T> centraliza tratamento de erros comuns do PostgreSQL/TypeORM.
 * Herde esta classe nos repositórios específicos para DRY e padronização.
 */
export abstract class BaseTypeOrmRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  protected handlePostgresError(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      switch ((error as any).code) {
        case '23505':
          throw new ConflictException('Registro duplicado.', {
            cause: error,
            description: 'Já existe registro com os dados informados.',
          });
        case '23502':
          throw new BadRequestException('Campo obrigatório não informado.', {
            cause: error,
            description: 'Verifique os campos obrigatórios.',
          });
        case '23503':
          throw new BadRequestException('Relacionamento inválido.', {
            cause: error,
            description: 'Verifique as chaves estrangeiras.',
          });
        case '23514':
          throw new BadRequestException('Valor inválido para um dos campos.', {
            cause: error,
            description: 'Verifique as restrições dos campos.',
          });
        default:
          throw error;
      }
    }
    throw error;
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
      throw new NotFoundException(`Record not found for ID: ${id}`);
    }
    try {
      return await this.repository.save(updateEntity, options);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async findMany(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
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
