import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

export const setupTestApp = async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  await app.init();
  const dataSource = app.get(DataSource);

  await dataSource.runMigrations(); // Executa as migrações

  return { app, module, dataSource };
};
