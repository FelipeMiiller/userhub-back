import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  Repository,
  SaveOptions,
} from 'typeorm';
import { DatabaseException } from '../exeption/database.exception';
import { DefaultEntity } from '../entity/default.entity';

interface PostgresError {
  code: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
  [key: string]: any;
}

export abstract class DefaultTypeOrmRepository<T extends DefaultEntity<T>> {
  private repository: Repository<T>;
  protected transactionalEntityManager: EntityManager;
  constructor(
    readonly entity: EntityTarget<T>,
    readonly manager: EntityManager,
  ) {
    /**
     * Note that we don't extend the Repository class from TypeORM, but we use it as a property.
     * This way we can control the access to the repository methods and avoid exposing them to the outside world.
     */
    this.repository = manager.getRepository(entity);
    this.transactionalEntityManager = manager;
  }

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
  async findOneById(Id: string, relations?: string[]): Promise<T | null> {
    return this.repository.findOne({
      where: { Id } as FindOptionsWhere<T>,
      relations,
    });
  }

  async find(options: FindOneOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findMany(Options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find(Options);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }
  async exists(Id: string): Promise<boolean> {
    return this.repository.exists({
      where: { Id } as FindOptionsWhere<T>,
    });
  }

  async existsBy(properties: FindOptionsWhere<T>): Promise<boolean> {
    return this.repository.exists({
      where: properties,
    });
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

  /**
   * Realiza soft delete (marca como deletado, sem remover do banco)
   */
  async softDelete(
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
      await this.repository.softDelete(criteria);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }

  /**
   * Restaura registros soft deleted
   */
  async restore(
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
      await this.repository.restore(criteria);
    } catch (error) {
      this.handlePostgresError(error);
    }
  }

  /**
   * Busca incluindo registros deletados (soft delete)
   */
  async findManyWithDeleted(Options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find({ ...(Options || {}), withDeleted: true });
    } catch (error) {
      this.handlePostgresError(error);
    }
  }

  /**
   * Busca um registro incluindo deletados (soft delete)
   */
  async findOneWithDeleted(Options: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.repository.findOne({ ...Options, withDeleted: true });
    } catch (error) {
      this.handlePostgresError(error);
    }
  }
}
