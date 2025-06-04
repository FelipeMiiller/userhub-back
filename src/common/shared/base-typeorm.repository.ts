import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
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
        
          throw new InternalServerErrorException(
            'Ocorreu um erro desconhecido no banco de dados.',
            {
              cause: error,
              description: `Código de erro PostgreSQL: ${(error as any).code}`,
            },
          );
      }
    }
    throw new InternalServerErrorException('Ocorreu um erro inesperado no banco de dados.', {
      cause: error,
    });
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

  async clear(): Promise<void> {
    try {
      await this.repository.clear();
    } catch (error) {
      this.handlePostgresError(error);
    }
  }
}
