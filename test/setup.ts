import { Test } from '@nestjs/testing';

import { DataSource } from 'typeorm';
import { AppModule } from '../apps/monolith/src/app.module';

export const createNestApp = async (modules: any[] = [AppModule]) => {
  const module = await Test.createTestingModule({
    imports: modules,
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  const dataSource = app.get(DataSource);
  if (!dataSource) {
    throw new Error(
      'DataSource não foi inicializado. Verifique se o módulo importa o TypeOrmModule corretamente.',
    );
  }

  await dataSource.runMigrations();

  return { app, module, dataSource };
};
