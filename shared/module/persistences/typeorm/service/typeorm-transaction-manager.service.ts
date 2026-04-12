import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class TypeOrmTransactionManager {
  constructor(@Inject(DataSource) readonly dataSource: DataSource) {}

  getTransactionManager(): EntityManager {
    return this.dataSource.manager;
  }
}
