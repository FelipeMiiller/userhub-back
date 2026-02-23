import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModuleOptions } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';


export const createNestApp = async (metadata: ModuleMetadata, options?: TestingModuleOptions) => {
  initializeTransactionalContext();


  const module = await Test.createTestingModule(metadata, options).compile();

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
